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
