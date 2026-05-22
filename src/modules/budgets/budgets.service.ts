/**
 * Budgets service — budget CRUD and alert checking.
 */

import { query } from '../../config/database';
import { NotFoundError } from '../../shared/errors';
import { percentageUsed } from '../../shared/utils/money';
import { CreateBudgetInput } from './budgets.validation';

export class BudgetsService {

  async list(userId: string, month?: string) {
    const targetMonth = (month && month.length === 7) ? `${month}-01` : (month || new Date().toISOString().slice(0, 7) + '-01');
    const { rows } = await query(
      `SELECT b.*, 
              COALESCE(
                (SELECT SUM(t.amount_paise) FROM transactions t 
                 WHERE t.user_id = b.user_id AND t.type = 'expense'
                 AND t.transaction_date >= b.month 
                 AND t.transaction_date < (b.month + INTERVAL '1 month')::date
                 AND (b.scope = 'overall' OR 
                      (b.scope = 'category' AND t.category = b.category) OR
                      (b.scope = 'account' AND t.account_id = b.account_id))
                ), 0
              ) AS spent_paise
       FROM budgets b 
       WHERE b.user_id = $1 AND b.month = $2
       ORDER BY b.scope, b.created_at`,
      [userId, targetMonth]
    );

    return rows.map((row) => {
      const spent = Number(row.spent_paise);
      const budget = Number(row.amount_paise);
      return {
        id: row.id,
        userId: row.user_id,
        scope: row.scope,
        category: row.category,
        accountId: row.account_id,
        amountPaise: budget,
        spentPaise: spent,
        remainingPaise: Math.max(0, budget - spent),
        percentUsed: percentageUsed(spent, budget),
        month: row.month,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  async upsert(userId: string, input: CreateBudgetInput) {
    // Use ON CONFLICT to upsert
    const { rows: [budget] } = await query(
      `INSERT INTO budgets (user_id, scope, category, account_id, amount_paise, month)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, scope, COALESCE(category, ''), COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid), month)
       DO UPDATE SET amount_paise = EXCLUDED.amount_paise, alert_80_sent = false, alert_90_sent = false, alert_100_sent = false
       RETURNING *`,
      [userId, input.scope, input.category || null, input.accountId || null, input.amountPaise, input.month]
    );

    return {
      id: budget.id,
      scope: budget.scope,
      category: budget.category,
      accountId: budget.account_id,
      amountPaise: Number(budget.amount_paise),
      month: budget.month,
      message: 'Budget saved.',
    };
  }

  async delete(userId: string, budgetId: string) {
    const { rowCount } = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
      [budgetId, userId]
    );
    if (!rowCount) throw new NotFoundError('Budget not found.');
    return { message: 'Budget deleted.' };
  }

  /**
   * Check budgets and return those that need alerts.
   */
  async checkBudgetAlerts(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const budgets = await this.list(userId, currentMonth);

    const alerts: Array<{ budget: any; threshold: number }> = [];

    for (const budget of budgets) {
      const pct = budget.percentUsed;

      if (pct >= 100) {
        // Check if 100% alert already sent
        const { rows } = await query(
          'SELECT alert_100_sent FROM budgets WHERE id = $1',
          [budget.id]
        );
        if (!rows[0]?.alert_100_sent) {
          await query('UPDATE budgets SET alert_100_sent = true WHERE id = $1', [budget.id]);
          alerts.push({ budget, threshold: 100 });
        }
      } else if (pct >= 90) {
        const { rows } = await query(
          'SELECT alert_90_sent FROM budgets WHERE id = $1',
          [budget.id]
        );
        if (!rows[0]?.alert_90_sent) {
          await query('UPDATE budgets SET alert_90_sent = true WHERE id = $1', [budget.id]);
          alerts.push({ budget, threshold: 90 });
        }
      } else if (pct >= 80) {
        const { rows } = await query(
          'SELECT alert_80_sent FROM budgets WHERE id = $1',
          [budget.id]
        );
        if (!rows[0]?.alert_80_sent) {
          await query('UPDATE budgets SET alert_80_sent = true WHERE id = $1', [budget.id]);
          alerts.push({ budget, threshold: 80 });
        }
      }
    }

    return alerts;
  }
}

export const budgetsService = new BudgetsService();
