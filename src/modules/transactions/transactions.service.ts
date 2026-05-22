/**
 * Transactions service — income/expense CRUD with balance safety.
 *
 * BALANCE RULES:
 * 1. Expense: subtract from account — FAIL if balance insufficient.
 * 2. Income: add to account.
 * 3. Transfer: subtract from source, add to destination.
 * 4. Edit: reverse old effect, apply new effect — all in one transaction.
 * 5. Delete: reverse the transaction's effect on the account.
 * 6. All write operations use READ COMMITTED isolation + SELECT FOR UPDATE.
 */

import { query, withTransaction } from '../../config/database';
import { NotFoundError, BadRequestError, InsufficientBalanceError } from '../../shared/errors';
import { canDeduct } from '../../shared/utils/money';
import { buildPaginationMeta } from '../../shared/utils/response';
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from './transactions.validation';
import { PoolClient } from 'pg';

export class TransactionsService {

  /**
   * Create a transaction and update account balance atomically.
   */
  async create(userId: string, input: CreateTransactionInput) {
    return withTransaction(async (client: PoolClient) => {
      // Lock source account
      const { rows: accounts } = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true FOR UPDATE',
        [input.accountId, userId]
      );
      if (accounts.length === 0) throw new NotFoundError('Account not found.');

      const account = accounts[0];
      const currentBalance = Number(account.current_balance_paise);

      // Balance check for expenses
      if (input.type === 'expense' && !canDeduct(currentBalance, input.amountPaise)) {
        throw new InsufficientBalanceError(
          `Insufficient balance. Available: ${currentBalance}, Required: ${input.amountPaise}`
        );
      }

      // For transfers, lock destination and check source balance
      if (input.type === 'transfer') {
        if (!input.transferToAccountId) {
          throw new BadRequestError('Transfer requires a destination account.');
        }
        if (input.transferToAccountId === input.accountId) {
          throw new BadRequestError('Cannot transfer to the same account.');
        }
        if (!canDeduct(currentBalance, input.amountPaise)) {
          throw new InsufficientBalanceError('Insufficient balance for transfer.');
        }
        // Lock destination
        const { rows: destAccounts } = await client.query(
          'SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true FOR UPDATE',
          [input.transferToAccountId, userId]
        );
        if (destAccounts.length === 0) throw new NotFoundError('Destination account not found.');
      }

      // Create the transaction record
      const { rows: [txn] } = await client.query(
        `INSERT INTO transactions 
         (user_id, account_id, type, category, amount_paise, note, transaction_date,
          payment_method, tags, receipt_url, is_recurring, recurring_interval, transfer_to_account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          userId, input.accountId, input.type, input.category, input.amountPaise,
          input.note || null, input.transactionDate, input.paymentMethod || null,
          input.tags || null, input.receiptUrl || null,
          input.isRecurring, input.recurringInterval || null,
          input.transferToAccountId || null,
        ]
      );

      // Update balances
      if (input.type === 'income') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [input.amountPaise, input.accountId]
        );
      } else if (input.type === 'expense') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [input.amountPaise, input.accountId]
        );
      } else if (input.type === 'transfer') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [input.amountPaise, input.accountId]
        );
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [input.amountPaise, input.transferToAccountId]
        );
      }

      return this.formatTransaction(txn);
    });
  }

  /**
   * Update a transaction — reverses old balance effect, applies new one.
   */
  async update(userId: string, txnId: string, input: UpdateTransactionInput) {
    return withTransaction(async (client: PoolClient) => {
      // Get and lock old transaction
      const { rows: oldTxns } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [txnId, userId]
      );
      if (oldTxns.length === 0) throw new NotFoundError('Transaction not found.');
      const oldTxn = oldTxns[0];

      // Determine accounts involved
      const oldAccountId = oldTxn.account_id;
      const newAccountId = input.accountId || oldAccountId;
      const oldDestId = oldTxn.transfer_to_account_id;
      const newDestId = input.transferToAccountId || oldDestId;
      const newType = input.type || oldTxn.type;

      const accountIdsRaw = [oldAccountId, newAccountId];
      if (oldTxn.type === 'transfer' && oldDestId) accountIdsRaw.push(oldDestId);
      if (newType === 'transfer' && newDestId) accountIdsRaw.push(newDestId);
      
      const accountIds = [...new Set(accountIdsRaw)].filter(Boolean).sort();

      // Lock all relevant accounts (consistent ordering prevents deadlocks)
      const { rows: accounts } = await client.query(
        'SELECT * FROM accounts WHERE id = ANY($1) AND user_id = $2 AND is_active = true FOR UPDATE',
        [accountIds, userId]
      );
      if (accounts.length !== accountIds.length) {
        throw new NotFoundError('One or more accounts not found.');
      }

      // Step 1: REVERSE old transaction effect
      const oldAmount = Number(oldTxn.amount_paise);
      if (oldTxn.type === 'income') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [oldAmount, oldAccountId]
        );
      } else if (oldTxn.type === 'expense') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [oldAmount, oldAccountId]
        );
      } else if (oldTxn.type === 'transfer' && oldTxn.transfer_to_account_id) {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [oldAmount, oldAccountId]
        );
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [oldAmount, oldTxn.transfer_to_account_id]
        );
      }

      // Step 2: Build new values
      // newType already computed above
      const newAmount = input.amountPaise !== undefined ? input.amountPaise : oldAmount;

      // Step 3: Check if new effect is affordable
      if (newType === 'expense' || newType === 'transfer') {
        const { rows: [acct] } = await client.query(
          'SELECT current_balance_paise FROM accounts WHERE id = $1',
          [newAccountId]
        );
        if (!canDeduct(Number(acct.current_balance_paise), newAmount)) {
          throw new InsufficientBalanceError('Insufficient balance after recalculation.');
        }
      }

      // Step 4: Apply new effect
      if (newType === 'income') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [newAmount, newAccountId]
        );
      } else if (newType === 'expense') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [newAmount, newAccountId]
        );
      } else if (newType === 'transfer') {
        if (!newDestId) throw new BadRequestError('Transfer requires a destination account.');
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [newAmount, newAccountId]
        );
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [newAmount, newDestId]
        );
      }

      // Step 5: Update transaction record
      const sets: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      const fieldMap: Record<string, string> = {
        accountId: 'account_id', type: 'type', category: 'category',
        amountPaise: 'amount_paise', note: 'note', transactionDate: 'transaction_date',
        paymentMethod: 'payment_method', tags: 'tags', receiptUrl: 'receipt_url',
        isRecurring: 'is_recurring', recurringInterval: 'recurring_interval',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if ((input as Record<string, unknown>)[key] !== undefined) {
          sets.push(`${col} = $${i++}`);
          params.push((input as Record<string, unknown>)[key]);
        }
      }

      if (sets.length > 0) {
        params.push(txnId, userId);
        const { rows } = await client.query(
          `UPDATE transactions SET ${sets.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
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
      const { rows: txns } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [txnId, userId]
      );
      if (txns.length === 0) throw new NotFoundError('Transaction not found.');
      const txn = txns[0];

      // Lock accounts
      await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [txn.account_id]);

      const amount = Number(txn.amount_paise);
      if (txn.type === 'income') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [amount, txn.account_id]
        );
      } else if (txn.type === 'expense') {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [amount, txn.account_id]
        );
      } else if (txn.type === 'transfer' && txn.transfer_to_account_id) {
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise + $1 WHERE id = $2',
          [amount, txn.account_id]
        );
        await client.query(
          'UPDATE accounts SET current_balance_paise = current_balance_paise - $1 WHERE id = $2',
          [amount, txn.transfer_to_account_id]
        );
      }

      await client.query('DELETE FROM transactions WHERE id = $1', [txnId]);
      return { message: 'Transaction deleted and balance restored.' };
    });
  }

  /**
   * Get transaction by ID.
   */
  async getById(userId: string, txnId: string) {
    const { rows } = await query(
      `SELECT t.*, a.account_name, a.type AS account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
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
    const params: unknown[] = [userId];
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
    const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const { rows } = await query(
      `SELECT t.*, a.account_name, a.type AS account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}, t.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, filters.limit, offset]
    );

    const meta = buildPaginationMeta(total, filters.page, filters.limit);
    return { transactions: rows.map(this.formatTransaction), meta };
  }

  private formatTransaction(row: Record<string, unknown>) {
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
