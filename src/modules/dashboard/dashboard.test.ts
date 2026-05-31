import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { pool } from '../../config/database';
import * as authMiddleware from '../../shared/middleware/authenticate';

// Mock the authenticate middleware to always succeed
vi.mock('../../shared/middleware/authenticate', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => next()
}));

const mockQuery = pool.query as any;

describe('Dashboard Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard summary successfully', async () => {
      mockQuery.mockImplementation((queryText: string) => {
        if (queryText.includes('total_balance')) {
          return Promise.resolve({ rows: [{ total_balance: '1500000' }] }); // 15000.00
        }
        if (queryText.includes('current month') || queryText.includes('transaction_date >= $2 AND transaction_date < ($2::date + INTERVAL \'1 month\')::date') && !queryText.includes('prevMonth')) {
          // This matches both current and prev month queries based on params, but we can return fixed mock
          return Promise.resolve({
            rows: [
              { type: 'income', total: '2000000', count: '2' },
              { type: 'expense', total: '500000', count: '5' }
            ]
          });
        }
        if (queryText.includes('LIMIT 5')) {
          return Promise.resolve({
            rows: [
              {
                id: 'tx1',
                type: 'expense',
                category: 'Food',
                amount_paise: '20000',
                note: 'Lunch',
                transaction_date: '2023-10-15',
                account_name: 'Cash',
                account_type: 'cash'
              }
            ]
          });
        }
        if (queryText.includes('scope = \'overall\'')) {
          return Promise.resolve({ rows: [{ amount_paise: '1000000', scope: 'overall' }] });
        }
        
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBalancePaise).toBe(1500000);
      expect(res.body.data.currentMonth.incomePaise).toBe(2000000);
      expect(res.body.data.currentMonth.expensePaise).toBe(500000);
      expect(res.body.data.currentMonth.savingsPaise).toBe(1500000);
      expect(res.body.data.currentMonth.transactionCount).toBe(7);
      expect(res.body.data.budget.amountPaise).toBe(1000000);
      expect(res.body.data.budget.spentPaise).toBe(500000);
      expect(res.body.data.budget.remainingPaise).toBe(500000);
      expect(res.body.data.budget.percentUsed).toBe(50);
      expect(res.body.data.recentTransactions).toHaveLength(1);
    });

    it('should return dashboard summary correctly with no budget and zero stats', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // Default to empty array
      // But we need total_balance query to return at least [{ total_balance: null }] or something
      mockQuery.mockImplementation((queryText: string) => {
        if (queryText.includes('total_balance')) {
          return Promise.resolve({ rows: [{ total_balance: '0' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBalancePaise).toBe(0);
      expect(res.body.data.currentMonth.incomePaise).toBe(0);
      expect(res.body.data.currentMonth.expensePaise).toBe(0);
      expect(res.body.data.currentMonth.savingsPaise).toBe(0);
      expect(res.body.data.budget).toBeNull();
      expect(res.body.data.recentTransactions).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(500); // Or whatever error code is mapped
      expect(res.body.success).toBe(false);
    });
  });
});
