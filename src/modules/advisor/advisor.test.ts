import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { pool } from '../../config/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const generateToken = (userId: string) => {
  return jwt.sign({ sub: userId, email: 'test@example.com' }, JWT_SECRET);
};

const mockUserId = 'user-123';
const validToken = generateToken(mockUserId);

beforeEach(() => {
  vi.clearAllMocks();

  (pool.query as any).mockImplementation((text: string, params: any[]) => {
    // Auth profile check
    if (text.includes('user_profiles')) {
      return Promise.resolve({
        rows: [{ id: mockUserId, email: 'test@example.com', full_name: 'Test User' }]
      });
    }

    // Advisor getInsights top spending category
    if (text.includes('SELECT category, COALESCE(SUM(amount_paise), 0) AS total')) {
      return Promise.resolve({
        rows: [
          { category: 'Food', total: '150000' } // 1500.00 INR
        ]
      });
    }

    return Promise.resolve({ rows: [] });
  });
});

describe('Advisor Module', () => {
  describe('GET /api/advisor/insights', () => {
    it('should return insights including top category', async () => {
      const res = await request(app)
        .get('/api/advisor/insights')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.insights).toBeDefined();
      expect(res.body.data.insights.length).toBeGreaterThan(0);
      expect(res.body.data.insights[1]).toMatch(/Your highest spending category this month is Food/);
      expect(res.body.data.suggestions).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/advisor/insights');
      expect(res.status).toBe(401);
    });
  });
});
