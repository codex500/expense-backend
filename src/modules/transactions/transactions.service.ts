/**
 * Transactions service — income/expense CRUD with balance safety.
 *
 * CRITICAL BALANCE RULES:
 * 1. Expense: subtract from account — FAIL if balance insufficient.
 * 2. Income: add to account.
 * 3. Edit: reverse old effect, apply new effect — all in one transaction.
 * 4. Delete: reverse the transaction's effect on the account.
 * 5. All operations use SERIALIZABLE isolation + SELECT FOR UPDATE.
 */

import { query, withTransaction } from '../../config/database';
import { NotFoundError, BadRequestError, InsufficientBalanceError } from '../../shared/errors';
import { canDeduct } from '../../shared/utils/money';
import { buildPaginationMeta } from '../../shared/utils/response';
import PDFDocument from 'pdfkit';
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from './transactions.validation';
import { PaginationMeta } from '../../shared/types';
import { PoolClient } from 'pg';

export class TransactionsService {

  /**
   * Create a transaction and update account balance atomically.
   */
  async create(userId: string, input: CreateTransactionInput) {
    return withTransaction(async (client: PoolClient) => {
      // Lock account
      const { rows: accounts } = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true FOR UPDATE',
        [input.accountId, userId]
      );

      if (accounts.length === 0) throw new NotFoundError('Account not found.');
      const account = accounts[0];
      const currentBalance = Number(account.current_balance_paise);

      // For expenses: check balance
      if (input.type === 'expense') {
        if (!canDeduct(currentBalance, input.amountPaise)) {
          throw new InsufficientBalanceError(
            `Insufficient balance. Available: ${currentBalance}, Required: ${input.amountPaise}`
          );
        }
      }

      // Create the transaction
      const { rows: [txn] } = await client.query(
        `INSERT INTO transactions 
         (user_id, account_id, type, category, amount_paise, note, transaction_date, payment_method, tags, receipt_url, is_recurring, recurring_interval)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          userId, input.accountId, input.type, input.category, input.amountPaise,
          input.note || null, input.transactionDate, input.paymentMethod || null,
          input.tags || null, input.receiptUrl || null,
          input.isRecurring, input.recurringInterval || null,
        ]
      );

      // Update account balance
      const balanceChange = input.type === 'income' ? input.amountPaise : -input.amountPaise;
      await client.query(
        'UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW() WHERE id = $2',
        [balanceChange, input.accountId]
      );

      return this.formatTransaction(txn);
    });
  }

  /**
   * Update a transaction — reverses old balance effect, applies new one.
   */
  async update(userId: string, txnId: string, input: UpdateTransactionInput) {
    return withTransaction(async (client: PoolClient) => {
      // Get old transaction
      const { rows: oldTxns } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [txnId, userId]
      );
      if (oldTxns.length === 0) throw new NotFoundError('Transaction not found.');
      const oldTxn = oldTxns[0];

      // Determine which account(s) to lock
      const oldAccountId = oldTxn.account_id;
      const newAccountId = input.accountId || oldAccountId;
      const accountIds = [...new Set([oldAccountId, newAccountId])].sort();

      // Lock all relevant accounts
      const { rows: accounts } = await client.query(
        'SELECT * FROM accounts WHERE id = ANY($1) AND user_id = $2 AND is_active = true FOR UPDATE',
        [accountIds, userId]
      );

      if (accounts.length !== accountIds.length) {
        throw new NotFoundError('One or more accounts not found.');
      }

      // Step 1: REVERSE the old transaction's effect
      const oldBalance = Number(oldTxn.amount_paise);
      if (oldTxn.type === 'income') {
        // Income was added → subtract it back
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1, updated_at = NOW() WHERE id = $2',
          [oldBalance, oldAccountId]
        );
      } else if (oldTxn.type === 'expense') {
        // Expense was subtracted → add it back
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW() WHERE id = $2',
          [oldBalance, oldAccountId]
        );
      }

      // Step 2: Build new values
      const newType = input.type || oldTxn.type;
      const newAmount = input.amountPaise || Number(oldTxn.amount_paise);

      // Step 3: Check if new expense is affordable
      if (newType === 'expense') {
        const { rows: [acct] } = await client.query(
          'SELECT current_balance_paise FROM accounts WHERE id = $1',
          [newAccountId]
        );
        if (!canDeduct(Number(acct.current_balance_paise), newAmount)) {
          // Rollback will handle reverting step 1
          throw new InsufficientBalanceError(
            `Insufficient balance after recalculation.`
          );
        }
      }

      // Step 4: Apply new transaction effect
      const newBalanceChange = newType === 'income' ? newAmount : -newAmount;
      await client.query(
        'UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW() WHERE id = $2',
        [newBalanceChange, newAccountId]
      );

      // Step 5: Update the transaction record
      const sets: string[] = [];
      const params: any[] = [];
      let i = 1;

      const fieldMap: Record<string, string> = {
        accountId: 'account_id', type: 'type', category: 'category',
        amountPaise: 'amount_paise', note: 'note', transactionDate: 'transaction_date',
        paymentMethod: 'payment_method', tags: 'tags', receiptUrl: 'receipt_url',
        isRecurring: 'is_recurring', recurringInterval: 'recurring_interval',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if ((input as any)[key] !== undefined) {
          sets.push(`${col} = $${i++}`);
          params.push((input as any)[key]);
        }
      }

      if (sets.length > 0) {
        params.push(txnId, userId);
        const { rows } = await client.query(
          `UPDATE transactions SET ${sets.join(', ')}, updated_at = NOW()
           WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
          params
        );
        return this.formatTransaction(rows[0]);
      }

      return this.formatTransaction(oldTxn);
    });
  }

  /**
   * Delete a transaction — reverses its balance effect.
   */
  async delete(userId: string, txnId: string) {
    return withTransaction(async (client: PoolClient) => {
      // Lock the transaction
      const { rows: txns } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [txnId, userId]
      );
      if (txns.length === 0) throw new NotFoundError('Transaction not found.');
      const txn = txns[0];

      // Lock the account
      await client.query(
        'SELECT id FROM accounts WHERE id = $1 FOR UPDATE',
        [txn.account_id]
      );

      // Reverse the balance effect
      const amount = Number(txn.amount_paise);
      if (txn.type === 'income') {
        // Was added → subtract
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1, updated_at = NOW() WHERE id = $2',
          [amount, txn.account_id]
        );
      } else if (txn.type === 'expense') {
        // Was subtracted → add back
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW() WHERE id = $2',
          [amount, txn.account_id]
        );
      } else if (txn.type === 'transfer' && txn.transfer_to_account_id) {
        // Reverse transfer: add back to source, subtract from dest
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [amount, txn.account_id]
        );
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [amount, txn.transfer_to_account_id]
        );
      }

      // Delete the transaction
      await client.query('DELETE FROM transactions WHERE id = $1', [txnId]);

      return { message: 'Transaction deleted and balance restored.' };
    });
  }

  /**
   * Get transaction by ID.
   */
  async getById(userId: string, txnId: string) {
    const { rows } = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [txnId, userId]
    );
    if (rows.length === 0) throw new NotFoundError('Transaction not found.');
    return this.formatTransaction(rows[0]);
  }

  /**
   * Get paginated, filtered, sorted transaction list.
   */
  async list(userId: string, filters: TransactionQuery) {
    let whereClause = 'WHERE t.user_id = $1';
    const params: any[] = [userId];
    let paramIdx = 2;

    if (filters.type) {
      whereClause += ` AND t.type = $${paramIdx++}`;
      params.push(filters.type);
    }
    if (filters.category) {
      whereClause += ` AND t.category = $${paramIdx++}`;
      params.push(filters.category);
    }
    if (filters.accountId) {
      whereClause += ` AND t.account_id = $${paramIdx++}`;
      params.push(filters.accountId);
    }
    if (filters.startDate) {
      whereClause += ` AND t.transaction_date >= $${paramIdx++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ` AND t.transaction_date <= $${paramIdx++}`;
      params.push(filters.endDate);
    }
    if (filters.minAmountPaise) {
      whereClause += ` AND t.amount_paise >= $${paramIdx++}`;
      params.push(filters.minAmountPaise);
    }
    if (filters.maxAmountPaise) {
      whereClause += ` AND t.amount_paise <= $${paramIdx++}`;
      params.push(filters.maxAmountPaise);
    }
    if (filters.search) {
      whereClause += ` AND (t.note ILIKE $${paramIdx} OR t.category ILIKE $${paramIdx})`;
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    // Count total
    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);

    // Fetch page
    const offset = (filters.page - 1) * filters.limit;
    const sortCol = filters.sortBy === 'amount_paise' ? 't.amount_paise' :
                    filters.sortBy === 'created_at' ? 't.created_at' : 't.transaction_date';

    const { rows } = await query(
      `SELECT t.*, a.account_name, a.type AS account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       ${whereClause}
       ORDER BY ${sortCol} ${filters.sortOrder}, t.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, filters.limit, offset]
    );

    const meta = buildPaginationMeta(total, filters.page, filters.limit);

    return {
      transactions: rows.map(this.formatTransaction),
      meta,
    };
  }

  async exportPdf(userId: string, res: any) {
    const { rows: [user] } = await query('SELECT email, full_name, dob FROM user_profiles WHERE id = $1', [userId]);
    if (!user) throw new NotFoundError('User not found.');

    const dobStr = user.dob instanceof Date ? user.dob.toISOString().split('T')[0] : (typeof user.dob === 'string' ? user.dob : '1970-01-01');
    const dobParts = dobStr.split('-');
    const dobString = `${dobParts[2]}${dobParts[1]}${dobParts[0]}`;
    
    const rawName = user.full_name || user.email.split('@')[0];
    const namePrefix = rawName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    
    // Fallback if name length is less than 4
    const paddedNamePrefix = namePrefix.padEnd(4, 'X');
    const userPassword = `${dobString}${paddedNamePrefix}`;

    const { rows: txns } = await query(
      `SELECT t.*, a.account_name 
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [userId]
    );

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      userPassword,
      ownerPassword: userPassword,
      permissions: { printing: 'highResolution', modifying: false, copying: false }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_history.pdf');
    
    doc.pipe(res);

    // --- Helper for Footer ---
    const addFooter = () => {
      doc.fontSize(9)
         .fillColor('#94a3b8')
         .text(
           '© All copyrights are reserved by PixoraLabz.tech',
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );
    };

    // --- Header ---
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0f172a').text('TRACKIFY', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Premium Expense Tracking', 50, 75);
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Transaction Report', 300, 55, { align: 'right', width: 245 });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 300, 70, { align: 'right', width: 245 });

    // Divider
    doc.moveTo(50, 100).lineTo(545, 100).lineWidth(1).strokeColor('#e2e8f0').stroke();

    // --- User Info block ---
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('Generated For:', 50, 115);
    doc.font('Helvetica').text(`${user.full_name || user.email}`, 50, 130);
    if (user.full_name) doc.fillColor('#64748b').text(user.email, 50, 145);
    doc.fillColor('#334155').text(`Total Records: ${txns.length}`, 300, 130, { align: 'right', width: 245 });

    // --- Table Configuration ---
    let y = 190;
    const colX = { date: 50, details: 130, account: 330, amount: 450 };

    // Table Header
    doc.rect(50, y - 5, 495, 20).fill('#f1f5f9');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    doc.text('DATE', colX.date, y);
    doc.text('CATEGORY / NOTE', colX.details, y);
    doc.text('ACCOUNT', colX.account, y);
    doc.text('AMOUNT (₹)', colX.amount, y, { width: 95, align: 'right' });
    
    y += 25;

    // --- Table Data ---
    doc.font('Helvetica');
    txns.forEach((txn: any) => {
      // Check for page break
      if (y > doc.page.height - 100) {
        addFooter();
        doc.addPage();
        y = 50;
      }

      const amountStr = (Number(txn.amount_paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2});
      const dateStr = new Date(txn.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const acct = txn.account_name || 'Unknown Account';
      const cat = (txn.category || 'Uncategorized').toUpperCase();
      const note = txn.note ? txn.note.substring(0, 30) : '';

      doc.fontSize(9).fillColor('#64748b').text(dateStr, colX.date, y);
      
      doc.fillColor('#0f172a').text(cat, colX.details, y);
      if (note) {
        doc.fontSize(8).fillColor('#94a3b8').text(note, colX.details, y + 12);
      }

      doc.fontSize(9).fillColor('#64748b').text(acct, colX.account, y);

      const color = txn.type === 'income' ? '#10b981' : '#ef4444';
      const sign = txn.type === 'income' ? '+' : '-';
      doc.font('Helvetica-Bold').fillColor(color).text(`${sign} ${amountStr}`, colX.amount, y, { width: 95, align: 'right' });

      // Move Y down - extra space if note exists
      y += (note ? 30 : 20);
      
      // Row divider
      doc.moveTo(50, y - 5).lineTo(545, y - 5).lineWidth(0.5).strokeColor('#f1f5f9').stroke();
    });

    addFooter();
    doc.end();
  }

  private formatTransaction(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      accountName: row.account_name || undefined,
      accountType: row.account_type || undefined,
      type: row.type,
      category: row.category,
      amountPaise: Number(row.amount_paise),
      note: row.note,
      transactionDate: row.transaction_date,
      paymentMethod: row.payment_method,
      tags: row.tags,
      receiptUrl: row.receipt_url,
      isRecurring: row.is_recurring,
      recurringInterval: row.recurring_interval,
      transferToAccountId: row.transfer_to_account_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const transactionsService = new TransactionsService();
