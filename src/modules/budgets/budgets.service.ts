/**
 * Budgets service — monthly/category/account budgets with alert tracking.
 */

import { query } from '../../config/database';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { percentageUsed } from '../../shared/utils/money';
import { CreateBudgetInput, UpdateBudgetInput } from './budgets.validation';

export class BudgetsService {

  async create(userId: string, input: CreateBudgetInput) {
    // Check for duplicate
    const { rows: existing } = await query(
      `SELECT id FROM budgets WHERE user_id = $1 AND scope = $2 AND month = $3
       AND ($4::text IS NULL OR category = $4)
       AND ($5::uuid IS NULL OR account_id = $5)`,
      [userId, input.scope, input.month, input.category || null, input.accountId || null]
    );

    if (existing.length > 0) {
      throw new ConflictError('A budget already exists for this scope and month.');
    }

    const { rows } = await query(
      `INSERT INTO budgets (user_id, scope, category, account_id, amount_paise, month)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, input.scope, input.category || null, input.accountId || null, input.amountPaise, input.month]
    );

    return this.formatBudget(rows[0]);
  }

  async update(userId: string, budgetId: string, input: UpdateBudgetInput) {
    const { rows } = await query(
      `UPDATE budgets SET amount_paise = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [input.amountPaise, budgetId, userId]
    );
    if (rows.length === 0) throw new NotFoundError('Budget not found.');
    return this.formatBudget(rows[0]);
  }

  async delete(userId: string, budgetId: string) {
    const { rowCount } = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
      [budgetId, userId]
    );
    if (rowCount === 0) throw new NotFoundError('Budget not found.');
    return { message: 'Budget deleted.' };
  }

  async getCurrent(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    const { rows } = await query(
      `SELECT b.*, 
              COALESCE(
                (SELECT SUM(t.amount_paise) FROM transactions t
                 WHERE t.user_id = b.user_id AND t.type = 'expense'
                 AND t.transaction_date >= b.month
                 AND t.transaction_date < (b.month + INTERVAL '1 month')::date
                 AND (b.scope != 'category' OR t.category = b.category)
                 AND (b.scope != 'account' OR t.account_id = b.account_id)
                ), 0
              ) AS spent_paise
       FROM budgets b
       WHERE b.user_id = $1 AND b.month = $2
       ORDER BY b.scope, b.category`,
      [userId, currentMonth]
    );

    return rows.map(row => {
      const budget = this.formatBudget(row);
      const spentPaise = Number(row.spent_paise);
      const pctUsed = percentageUsed(spentPaise, budget.amountPaise);

      return {
        ...budget,
        spentPaise,
        remainingPaise: Math.max(0, budget.amountPaise - spentPaise),
        percentUsed: pctUsed,
        status: pctUsed >= 100 ? 'exceeded' : pctUsed >= 90 ? 'critical' : pctUsed >= 80 ? 'warning' : 'safe',
      };
    });
  }

  /**
   * Check all budgets for a user and return alerts for those crossing thresholds.
   * Used by cron jobs for email/notification triggers.
   */
  async checkBudgetAlerts(userId: string) {
    const budgets = await this.getCurrent(userId);
    const alerts: Array<{ budget: any; threshold: number }> = [];

    for (const b of budgets) {
      if (b.percentUsed >= 100 && !b.alert100Sent) {
        alerts.push({ budget: b, threshold: 100 });
        await query('UPDATE budgets SET alert_100_sent = true WHERE id = $1', [b.id]);
      } else if (b.percentUsed >= 90 && !b.alert90Sent) {
        alerts.push({ budget: b, threshold: 90 });
        await query('UPDATE budgets SET alert_90_sent = true WHERE id = $1', [b.id]);
      } else if (b.percentUsed >= 80 && !b.alert80Sent) {
        alerts.push({ budget: b, threshold: 80 });
        await query('UPDATE budgets SET alert_80_sent = true WHERE id = $1', [b.id]);
      }
    }

    return alerts;
  }

  private formatBudget(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      scope: row.scope,
      category: row.category,
      accountId: row.account_id,
      amountPaise: Number(row.amount_paise),
      month: row.month,
      alert80Sent: row.alert_80_sent,
      alert90Sent: row.alert_90_sent,
      alert100Sent: row.alert_100_sent,
      createdAt: row.created_at,
    };
  }
}

export const budgetsService = new BudgetsService();
