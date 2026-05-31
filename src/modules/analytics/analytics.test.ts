import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { pool } from '../../config/database';

// Mock the authenticate middleware to always succeed
vi.mock('../../shared/middleware/authenticate', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => next()
}));

const mockQuery = pool.query as any;

describe('Analytics Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/analytics', () => {
    it('should return overall analytics successfully', async () => {
      mockQuery.mockImplementation((queryText: string) => {
        if (queryText.includes('GROUP BY month, type')) {
          return Promise.resolve({
            rows: [
              { month: '2023-09-01', type: 'income', total: '2000000', count: '1' },
              { month: '2023-09-01', type: 'expense', total: '500000', count: '2' },
              { month: '2023-10-01', type: 'expense', total: '800000', count: '4' }
            ]
          });
        }
        if (queryText.includes('category, COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count') && queryText.includes('GROUP BY category') && !queryText.includes('LIMIT 5')) {
          // current month category breakdown
          return Promise.resolve({
            rows: [
              { category: 'Food', total: '500000', count: '3' },
              { category: 'Transport', total: '300000', count: '1' }
            ]
          });
        }
        if (queryText.includes('LIMIT 5')) {
          // top categories
          return Promise.resolve({
            rows: [
              { category: 'Food', total: '1500000', count: '10' }
            ]
          });
        }
        if (queryText.includes('GROUP BY transaction_date')) {
          // daily spending
          return Promise.resolve({
            rows: [
              { day: '2023-10-15', total: '200000' }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .get('/api/analytics?months=6')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyTrend).toHaveLength(2);
      expect(res.body.data.monthlyTrend[0].month).toBe('2023-09-01');
      expect(res.body.data.monthlyTrend[0].income).toBe(2000000);
      expect(res.body.data.monthlyTrend[0].expense).toBe(500000);
      expect(res.body.data.monthlyTrend[0].savings).toBe(1500000);

      expect(res.body.data.categoryBreakdown).toHaveLength(2);
      expect(res.body.data.categoryBreakdown[0].category).toBe('Food');
      expect(res.body.data.categoryBreakdown[0].percentage).toBe(63); // 500k / 800k = ~63%

      expect(res.body.data.topCategories).toHaveLength(1);
      expect(res.body.data.dailySpending).toHaveLength(1);
    });

    it('should return error if database fails', async () => {
      mockQuery.mockRejectedValue(new Error('DB Error'));
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/category', () => {
    it('should return category analytics successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { category: 'Food', total: '500000', count: '3' },
          { category: 'Transport', total: '300000', count: '1' }
        ]
      });

      const res = await request(app)
        .get('/api/analytics/category?month=2023-10')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].category).toBe('Food');
      expect(res.body.data[0].percentage).toBe(63);
    });

    it('should calculate 0 percentage for empty records correctly', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(app)
        .get('/api/analytics/category?month=2023-10')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/analytics/monthly', () => {
    it('should return monthly analytics successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { month: '2023-09-01', type: 'income', total: '2000000', count: '1' }
        ]
      });

      const res = await request(app)
        .get('/api/analytics/monthly?months=6')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].month).toBe('2023-09-01');
      expect(res.body.data[0].income).toBe(2000000);
    });
  });

  describe('GET /api/analytics/weekly', () => {
    it('should return weekly analytics successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { week: '2023-10-01', total: '500000' }
        ]
      });

      const res = await request(app)
        .get('/api/analytics/weekly?month=2023-10')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].week).toBe('2023-10-01');
      expect(res.body.data[0].expense).toBe(500000);
    });
  });
});
