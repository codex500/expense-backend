/**
 * Accounts service — CRUD operations for financial accounts.
 */

import { query, withTransaction } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import { CreateAccountInput, UpdateAccountInput } from './accounts.validation';
import { PoolClient } from 'pg';

export class AccountsService {

  async list(userId: string) {
    const { rows } = await query(
      `SELECT * FROM accounts WHERE user_id = $1 AND is_active = true ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return rows.map(this.format);
  }

  async getById(userId: string, accountId: string) {
    const { rows } = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true',
      [accountId, userId]
    );
    if (rows.length === 0) throw new NotFoundError('Account not found.');
    return this.format(rows[0]);
  }

  async create(userId: string, input: CreateAccountInput) {
    return withTransaction(async (client: PoolClient) => {
      // If this is set as default, unset all others
      if (input.isDefault) {
        await client.query(
          'UPDATE accounts SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      const { rows: [account] } = await client.query(
        `INSERT INTO accounts (user_id, account_name, bank_name, type, current_balance_paise, icon, color, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          input.accountName,
          input.bankName || null,
          input.type,
          input.initialBalancePaise || 0,
          input.icon || 'wallet',
          input.color || '#6366F1',
          input.isDefault || false,
        ]
      );

      return this.format(account);
    });
  }

  async update(userId: string, accountId: string, input: UpdateAccountInput) {
    return withTransaction(async (client: PoolClient) => {
      // Verify ownership
      const { rows: existing } = await client.query(
        'SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true',
        [accountId, userId]
      );
      if (existing.length === 0) throw new NotFoundError('Account not found.');

      // If setting as default, unset others
      if (input.isDefault) {
        await client.query(
          'UPDATE accounts SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      const sets: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      const fieldMap: Record<string, string> = {
        accountName: 'account_name',
        bankName: 'bank_name',
        type: 'type',
        icon: 'icon',
        color: 'color',
        isDefault: 'is_default',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if ((input as Record<string, unknown>)[key] !== undefined) {
          sets.push(`${col} = $${idx++}`);
          params.push((input as Record<string, unknown>)[key]);
        }
      }

      if (sets.length === 0) throw new BadRequestError('No fields to update.');

      params.push(accountId, userId);
      const { rows } = await client.query(
        `UPDATE accounts SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
        params
      );

      return this.format(rows[0]);
    });
  }

  async delete(userId: string, accountId: string) {
    // Check if account has transactions
    const { rows: txnCheck } = await query(
      'SELECT COUNT(*) as cnt FROM transactions WHERE account_id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (Number(txnCheck[0].cnt) > 0) {
      // Soft delete — mark inactive
      await query(
        'UPDATE accounts SET is_active = false WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );
      return { message: 'Account deactivated (has existing transactions).' };
    }

    // Hard delete if no transactions
    const { rowCount } = await query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (!rowCount) throw new NotFoundError('Account not found.');
    return { message: 'Account deleted.' };
  }

  private format(row: Record<string, unknown>) {
    return {
      id: row.id,
      userId: row.user_id,
      accountName: row.account_name,
      bankName: row.bank_name,
      type: row.type,
      currentBalancePaise: Number(row.current_balance_paise),
      icon: row.icon,
      color: row.color,
      isDefault: row.is_default,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const accountsService = new AccountsService();
