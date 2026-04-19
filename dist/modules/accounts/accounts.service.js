"use strict";
/**
 * Accounts service — manages bank/wallet/UPI accounts with balance safety.
 *
 * CRITICAL RULES:
 * 1. Balance can NEVER go negative — enforced at service + DB level.
 * 2. Transfers use SERIALIZABLE transactions with SELECT FOR UPDATE.
 * 3. All money is in integer paise.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsService = exports.AccountsService = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/errors");
const money_1 = require("../../shared/utils/money");
class AccountsService {
    async create(userId, input) {
        return (0, database_1.withTransaction)(async (client) => {
            // If this is the default account, un-default all others first
            if (input.isDefault) {
                await client.query('UPDATE accounts SET is_default = false WHERE user_id = $1', [userId]);
            }
            // Check if this is the first account — auto-default
            const { rows: existing } = await client.query('SELECT COUNT(*) AS cnt FROM accounts WHERE user_id = $1 AND is_active = true', [userId]);
            const isFirst = Number(existing[0].cnt) === 0;
            const { rows } = await client.query(`INSERT INTO accounts (user_id, account_name, bank_name, type, current_balance_paise, icon, color, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`, [
                userId,
                input.accountName,
                input.bankName || null,
                input.type,
                input.initialBalancePaise,
                input.icon,
                input.color,
                input.isDefault || isFirst,
            ]);
            return this.formatAccount(rows[0]);
        }, 'READ COMMITTED');
    }
    async update(userId, accountId, input) {
        return (0, database_1.withTransaction)(async (client) => {
            // Verify ownership
            const { rows: existing } = await client.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true', [accountId, userId]);
            if (existing.length === 0)
                throw new errors_1.NotFoundError('Account not found.');
            // If setting as default, un-default others
            if (input.isDefault) {
                await client.query('UPDATE accounts SET is_default = false WHERE user_id = $1', [userId]);
            }
            const sets = [];
            const params = [];
            let i = 1;
            if (input.accountName !== undefined) {
                sets.push(`account_name = $${i++}`);
                params.push(input.accountName);
            }
            if (input.bankName !== undefined) {
                sets.push(`bank_name = $${i++}`);
                params.push(input.bankName);
            }
            if (input.icon !== undefined) {
                sets.push(`icon = $${i++}`);
                params.push(input.icon);
            }
            if (input.color !== undefined) {
                sets.push(`color = $${i++}`);
                params.push(input.color);
            }
            if (input.isDefault !== undefined) {
                sets.push(`is_default = $${i++}`);
                params.push(input.isDefault);
            }
            if (sets.length === 0)
                throw new errors_1.BadRequestError('No fields to update.');
            params.push(accountId, userId);
            const { rows } = await client.query(`UPDATE accounts SET ${sets.join(', ')}, updated_at = NOW()
         WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`, params);
            return this.formatAccount(rows[0]);
        }, 'READ COMMITTED');
    }
    async delete(userId, accountId) {
        // Check for existing transactions — soft-delete if any exist
        const { rows: txns } = await (0, database_1.query)('SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = $1 OR transfer_to_account_id = $1', [accountId]);
        if (Number(txns[0].cnt) > 0) {
            // Soft-delete: mark as inactive
            await (0, database_1.query)('UPDATE accounts SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2', [accountId, userId]);
        }
        else {
            // Hard-delete: no transactions reference this account
            await (0, database_1.query)('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);
        }
        return { message: 'Account deleted.' };
    }
    async getAll(userId) {
        const { rows } = await (0, database_1.query)(`SELECT * FROM accounts WHERE user_id = $1 AND is_active = true ORDER BY is_default DESC, created_at ASC`, [userId]);
        return rows.map(this.formatAccount);
    }
    async getById(userId, accountId) {
        const { rows } = await (0, database_1.query)('SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true', [accountId, userId]);
        if (rows.length === 0)
            throw new errors_1.NotFoundError('Account not found.');
        return this.formatAccount(rows[0]);
    }
    async getSummary(userId) {
        const { rows } = await (0, database_1.query)(`SELECT 
         COUNT(*) FILTER (WHERE is_active) AS total_accounts,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE is_active), 0) AS total_balance_paise,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE type = 'cash' AND is_active), 0) AS cash_paise,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE type = 'bank_account' AND is_active), 0) AS bank_paise,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE type = 'upi' AND is_active), 0) AS upi_paise,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE type = 'credit_card' AND is_active), 0) AS credit_paise,
         COALESCE(SUM(current_balance_paise) FILTER (WHERE type = 'wallet' AND is_active), 0) AS wallet_paise
       FROM accounts WHERE user_id = $1`, [userId]);
        const r = rows[0];
        return {
            totalAccounts: Number(r.total_accounts),
            totalBalancePaise: Number(r.total_balance_paise),
            byType: {
                cash: Number(r.cash_paise),
                bank_account: Number(r.bank_paise),
                upi: Number(r.upi_paise),
                credit_card: Number(r.credit_paise),
                wallet: Number(r.wallet_paise),
            },
        };
    }
    /**
     * Transfer money between accounts — the most critical operation.
     * Uses SERIALIZABLE isolation + SELECT FOR UPDATE to prevent race conditions.
     */
    async transfer(userId, input) {
        if (input.fromAccountId === input.toAccountId) {
            throw new errors_1.BadRequestError('Cannot transfer to the same account.');
        }
        return (0, database_1.withTransaction)(async (client) => {
            // Lock both accounts with SELECT FOR UPDATE (ordered by ID to prevent deadlocks)
            const ids = [input.fromAccountId, input.toAccountId].sort();
            const { rows: accounts } = await client.query(`SELECT * FROM accounts 
         WHERE id = ANY($1) AND user_id = $2 AND is_active = true
         ORDER BY id
         FOR UPDATE`, [ids, userId]);
            if (accounts.length !== 2) {
                throw new errors_1.NotFoundError('One or both accounts not found.');
            }
            const fromAccount = accounts.find(a => a.id === input.fromAccountId);
            const toAccount = accounts.find(a => a.id === input.toAccountId);
            // CRITICAL: Check balance before deducting
            const fromBalance = Number(fromAccount.current_balance_paise);
            if (!(0, money_1.canDeduct)(fromBalance, input.amountPaise)) {
                throw new errors_1.InsufficientBalanceError(`Insufficient balance. Available: ${fromBalance}, Required: ${input.amountPaise}`);
            }
            // Deduct from source
            await client.query(`UPDATE accounts SET current_balance_paise = current_balance_paise - $1, updated_at = NOW()
         WHERE id = $2`, [input.amountPaise, input.fromAccountId]);
            // Add to destination
            await client.query(`UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW()
         WHERE id = $2`, [input.amountPaise, input.toAccountId]);
            // Create transfer transaction record
            const { rows: [txn] } = await client.query(`INSERT INTO transactions (user_id, account_id, type, category, amount_paise, note, transaction_date, transfer_to_account_id)
         VALUES ($1, $2, 'transfer', 'Transfer', $3, $4, $5, $6)
         RETURNING *`, [userId, input.fromAccountId, input.amountPaise, input.note || null, input.date, input.toAccountId]);
            return {
                transactionId: txn.id,
                fromAccount: { id: input.fromAccountId, newBalancePaise: fromBalance - input.amountPaise },
                toAccount: { id: input.toAccountId, newBalancePaise: Number(toAccount.current_balance_paise) + input.amountPaise },
                amountPaise: input.amountPaise,
            };
        }); // Default SERIALIZABLE isolation
    }
    formatAccount(row) {
        return {
            id: row.id,
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
exports.AccountsService = AccountsService;
exports.accountsService = new AccountsService();
//# sourceMappingURL=accounts.service.js.map