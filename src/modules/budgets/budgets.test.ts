import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { query } from '../../config/database';
import jwt from 'jsonwebtoken';
import { budgetsService } from './budgets.service';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const generateToken = (userId: string) => {
  return jwt.sign({ sub: userId, email: 'test@example.com' }, JWT_SECRET);
};

const mockUserId = 'user-123';
const validToken = generateToken(mockUserId);
const mockBudgetId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

beforeEach(() => {
  vi.clearAllMocks();

  (query as any).mockImplementation((text: string, params: any[]) => {
    if (text.includes('user_profiles')) {
      return Promise.resolve({
        rows: [{ id: mockUserId, email: 'test@example.com', full_name: 'Test User' }]
      });
    }
    if (text.includes('SELECT b.*')) {
      return Promise.resolve({
        rows: [
          {
            id: mockBudgetId,
            user_id: mockUserId,
            scope: 'overall',
            category: null,
            account_id: null,
            amount_paise: 500000,
            month: '2023-10-01',
            spent_paise: 100000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    }
    if (text.includes('INSERT INTO budgets')) {
      return Promise.resolve({
        rows: [
          {
            id: mockBudgetId,
            user_id: mockUserId,
            scope: params[1],
            category: params[2],
            account_id: params[3],
            amount_paise: params[4],
            month: params[5]
          }
        ]
      });
    }
    if (text.includes('DELETE FROM budgets')) {
      if (params[0] === mockBudgetId) {
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve({ rowCount: 0 });
    }
    if (text.includes('SELECT alert_100_sent') || text.includes('SELECT alert_90_sent') || text.includes('SELECT alert_80_sent')) {
      return Promise.resolve({ rows: [{ alert_100_sent: false, alert_90_sent: false, alert_80_sent: false }] });
    }
    if (text.includes('UPDATE budgets SET alert_')) {
      return Promise.resolve({ rowCount: 1 });
    }
    return Promise.resolve({ rows: [] });
  });
});

describe('Budgets Module', () => {
  describe('GET /api/budgets', () => {
    it('should return list of budgets for authenticated user', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(mockBudgetId);
      expect(res.body.data[0].amountPaise).toBe(500000);
      expect(res.body.data[0].spentPaise).toBe(100000);
      expect(res.body.data[0].remainingPaise).toBe(400000);
      expect(res.body.data[0].percentUsed).toBe(20);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/budgets');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/budgets', () => {
    it('should upsert a budget with valid input', async () => {
      const payload = {
        scope: 'overall',
        amountPaise: 1000000,
        month: '2023-11-01'
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amountPaise).toBe(1000000);
      expect(res.body.data.scope).toBe('overall');
    });

    it('should fail with invalid amount', async () => {
      const payload = {
        scope: 'overall',
        amountPaise: -500, // Invalid
        month: '2023-11-01'
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(422); // Validation error
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid month format', async () => {
      const payload = {
        scope: 'overall',
        amountPaise: 1000,
        month: '11-2023' // Invalid format
      };

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete existing budget', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${mockBudgetId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Budget deleted.');
    });

    it('should return 404 for non-existent budget', async () => {
      const res = await request(app)
        .delete('/api/budgets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app)
        .delete('/api/budgets/invalid-uuid')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(422); // Because of validate(idParamSchema)
    });
  });

  describe('Service: checkBudgetAlerts', () => {
    it('should trigger 100% alert', async () => {
      (query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('SELECT b.*')) {
          return Promise.resolve({
            rows: [
              {
                id: mockBudgetId,
                user_id: mockUserId,
                scope: 'overall',
                amount_paise: 500000,
                spent_paise: 500000, // 100%
                month: '2023-10-01'
              }
            ]
          });
        }
        if (text.includes('alert_100_sent')) {
          return Promise.resolve({ rows: [{ alert_100_sent: false }] });
        }
        if (text.includes('UPDATE budgets SET alert_100_sent')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      const alerts = await budgetsService.checkBudgetAlerts(mockUserId);
      expect(alerts.length).toBe(1);
      expect(alerts[0].threshold).toBe(100);
    });

    it('should trigger 90% alert', async () => {
      (query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('SELECT b.*')) {
          return Promise.resolve({
            rows: [
              {
                id: mockBudgetId,
                user_id: mockUserId,
                scope: 'overall',
                amount_paise: 500000,
                spent_paise: 450000, // 90%
                month: '2023-10-01'
              }
            ]
          });
        }
        if (text.includes('alert_90_sent')) {
          return Promise.resolve({ rows: [{ alert_90_sent: false }] });
        }
        if (text.includes('UPDATE budgets SET alert_90_sent')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      const alerts = await budgetsService.checkBudgetAlerts(mockUserId);
      expect(alerts.length).toBe(1);
      expect(alerts[0].threshold).toBe(90);
    });

    it('should trigger 80% alert', async () => {
      (query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('SELECT b.*')) {
          return Promise.resolve({
            rows: [
              {
                id: mockBudgetId,
                user_id: mockUserId,
                scope: 'overall',
                amount_paise: 500000,
                spent_paise: 400000, // 80%
                month: '2023-10-01'
              }
            ]
          });
        }
        if (text.includes('alert_80_sent')) {
          return Promise.resolve({ rows: [{ alert_80_sent: false }] });
        }
        if (text.includes('UPDATE budgets SET alert_80_sent')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      const alerts = await budgetsService.checkBudgetAlerts(mockUserId);
      expect(alerts.length).toBe(1);
      expect(alerts[0].threshold).toBe(80);
    });
  });
});
