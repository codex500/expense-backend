/**
 * Salary module — monthly salary deposit management.
 * 
 * On login, the system checks if salary for the current month exists.
 * If not, the frontend shows a salary popup.
 * When the user confirms, salary is deposited into the chosen account.
 */

import { z } from 'zod';
import { query, withTransaction } from '../../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/errors';
import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import { PoolClient } from 'pg';

// ── Validation ──
export const depositSalarySchema = z.object({
  accountId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Must be YYYY-MM-01'),
});

export type DepositSalaryInput = z.infer<typeof depositSalarySchema>;

// ── Service ──
export class SalaryService {

  /**
   * Check if salary for the current month has been deposited.
   */
  async checkCurrentMonth(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    const { rows } = await query(
      `SELECT se.*, a.account_name 
       FROM salary_entries se
       JOIN accounts a ON se.account_id = a.id
       WHERE se.user_id = $1 AND se.month = $2`,
      [userId, currentMonth]
    );

    const { rows: profileRows } = await query(
      'SELECT monthly_salary_paise, salary_account_id FROM user_profiles WHERE id = $1',
      [userId]
    );

    const profile = profileRows[0];

    return {
      deposited: rows.length > 0,
      entry: rows.length > 0 ? {
        id: rows[0].id,
        amountPaise: Number(rows[0].amount_paise),
        accountName: rows[0].account_name,
        depositedAt: rows[0].deposited_at,
      } : null,
      defaultSalaryPaise: Number(profile?.monthly_salary_paise || 0),
      defaultAccountId: profile?.salary_account_id,
      currentMonth,
    };
  }

  /**
   * Deposit salary — creates salary entry + income transaction + updates balance.
   * All in one atomic transaction.
   */
  async deposit(userId: string, input: DepositSalaryInput) {
    return withTransaction(async (client: PoolClient) => {
      // Check for duplicate
      const { rows: existing } = await client.query(
        'SELECT id FROM salary_entries WHERE user_id = $1 AND month = $2',
        [userId, input.month]
      );
      if (existing.length > 0) {
        throw new ConflictError('Salary for this month has already been deposited.');
      }

      // Verify account exists and lock it
      const { rows: accounts } = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true FOR UPDATE',
        [input.accountId, userId]
      );
      if (accounts.length === 0) throw new NotFoundError('Account not found.');

      // Create income transaction
      const { rows: [txn] } = await client.query(
        `INSERT INTO transactions (user_id, account_id, type, category, amount_paise, transaction_date, note)
         VALUES ($1, $2, 'income', 'Salary', $3, $4, 'Monthly salary deposit')
         RETURNING *`,
        [userId, input.accountId, input.amountPaise, input.month]
      );

      // Update account balance
      await client.query(
        'UPDATE accounts SET current_balance_paise = current_balance_paise + $1, updated_at = NOW() WHERE id = $2',
        [input.amountPaise, input.accountId]
      );

      // Create salary entry
      const { rows: [entry] } = await client.query(
        `INSERT INTO salary_entries (user_id, account_id, amount_paise, month, transaction_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, input.accountId, input.amountPaise, input.month, txn.id]
      );

      // Update default salary preferences
      await client.query(
        'UPDATE user_profiles SET monthly_salary_paise = $1, salary_account_id = $2, updated_at = NOW() WHERE id = $3',
        [input.amountPaise, input.accountId, userId]
      );

      return {
        salaryEntry: { id: entry.id, amountPaise: Number(entry.amount_paise), month: entry.month },
        transactionId: txn.id,
        message: 'Salary deposited successfully.',
      };
    });
  }

  /**
   * Get salary history.
   */
  async getHistory(userId: string) {
    const { rows } = await query(
      `SELECT se.*, a.account_name 
       FROM salary_entries se
       JOIN accounts a ON se.account_id = a.id
       WHERE se.user_id = $1
       ORDER BY se.month DESC`,
      [userId]
    );

    return rows.map(r => ({
      id: r.id,
      amountPaise: Number(r.amount_paise),
      month: r.month,
      accountName: r.account_name,
      depositedAt: r.deposited_at,
    }));
  }
}

export const salaryService = new SalaryService();

// ── Controller ──
class SalaryController {
  async check(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await salaryService.checkCurrentMonth(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async deposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await salaryService.deposit(req.user.id, req.body);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await salaryService.getHistory(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

const salaryController = new SalaryController();

// ── Routes ──
const router = Router();
router.use(authenticate as any);

router.get('/check', (req, res, next) => salaryController.check(req as any, res, next));
router.post('/deposit', validate({ body: depositSalarySchema }), (req, res, next) => salaryController.deposit(req as any, res, next));
router.get('/history', (req, res, next) => salaryController.history(req as any, res, next));

export default router;
