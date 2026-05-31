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
const mockAccountId = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock query for the pool directly
  (pool.query as any).mockImplementation((text: string, params: any[]) => {
    if (text.includes('user_profiles')) {
      return Promise.resolve({
        rows: [{ id: mockUserId, email: 'test@example.com', full_name: 'Test User' }]
      });
    }
    return Promise.resolve({ rows: [] });
  });

  // For transactions (withTransaction)
  const mockClient = {
    query: vi.fn().mockImplementation((text: string, params: any[]) => {
      // By default mock resolving rows: []
      return Promise.resolve({ rows: [] });
    }),
    release: vi.fn(),
  };
  (pool.connect as any).mockResolvedValue(mockClient);
});

describe('Accounts Module Integration Tests', () => {
  
  describe('GET /api/accounts', () => {
    it('should list all active accounts for user', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        if (text.includes('SELECT * FROM accounts')) {
          return Promise.resolve({
            rows: [
              {
                id: mockAccountId,
                user_id: mockUserId,
                account_name: 'Cash',
                type: 'cash',
                current_balance_paise: 100000,
                is_active: true
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].accountName).toBe('Cash');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return 404 if account not found', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] }); // No account found
      });

      const res = await request(app)
        .get(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('should return account details if found', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        if (text.includes('SELECT * FROM accounts WHERE id = $1')) {
          return Promise.resolve({
            rows: [{ id: mockAccountId, user_id: mockUserId, account_name: 'Cash', type: 'cash' }]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .get(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(mockAccountId);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      // Create request payload
      const payload = {
        accountName: 'New Bank',
        type: 'bank_account',
        initialBalancePaise: 50000,
        isDefault: true
      };

      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] });
      });

      const mockClient = {
        query: vi.fn().mockImplementation((text: string, params: any[]) => {
          if (text.includes('INSERT INTO accounts')) {
            return Promise.resolve({
              rows: [{
                id: mockAccountId,
                user_id: mockUserId,
                account_name: 'New Bank',
                type: 'bank_account',
                current_balance_paise: 50000,
                is_default: true
              }]
            });
          }
          return Promise.resolve({ rows: [] }); // For UPDATE accounts SET is_default = false
        }),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValue(mockClient);

      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountName).toBe('New Bank');
    });

    it('should return 400 if validation fails', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ accountName: '' }); // Invalid payload

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update an existing account', async () => {
      const payload = { accountName: 'Updated Bank', isDefault: true };

      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] });
      });

      const mockClient = {
        query: vi.fn().mockImplementation((text: string, params: any[]) => {
          if (text.includes('SELECT id FROM accounts')) {
            return Promise.resolve({ rows: [{ id: mockAccountId }] });
          }
          if (text.includes('UPDATE accounts SET account_name')) {
            return Promise.resolve({
              rows: [{ id: mockAccountId, account_name: 'Updated Bank', is_default: true }]
            });
          }
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValue(mockClient);

      const res = await request(app)
        .put(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.accountName).toBe('Updated Bank');
    });

    it('should return 404 if updating non-existent account', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] });
      });

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValue(mockClient);

      const res = await request(app)
        .put(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ accountName: 'Updated Bank' });

      expect(res.status).toBe(404);
    });

    it('should return 400 if no fields to update', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        return Promise.resolve({ rows: [] });
      });

      const mockClient = {
        query: vi.fn().mockImplementation((text: string) => {
          if (text.includes('SELECT id FROM accounts')) return Promise.resolve({ rows: [{ id: mockAccountId }] });
          return Promise.resolve({ rows: [] });
        }),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValue(mockClient);

      const res = await request(app)
        .put(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should soft delete if account has transactions', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        if (text.includes('SELECT COUNT(*)')) return Promise.resolve({ rows: [{ cnt: '5' }] }); // has transactions
        if (text.includes('UPDATE accounts SET is_active = false')) return Promise.resolve({ rowCount: 1 });
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .delete(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deactivated');
    });

    it('should hard delete if account has no transactions', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        if (text.includes('SELECT COUNT(*)')) return Promise.resolve({ rows: [{ cnt: '0' }] });
        if (text.includes('DELETE FROM accounts')) return Promise.resolve({ rowCount: 1 });
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .delete(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted.');
    });

    it('should return 404 if account not found on hard delete', async () => {
      (pool.query as any).mockImplementation((text: string, params: any[]) => {
        if (text.includes('user_profiles')) return Promise.resolve({ rows: [{ id: mockUserId }] });
        if (text.includes('SELECT COUNT(*)')) return Promise.resolve({ rows: [{ cnt: '0' }] });
        if (text.includes('DELETE FROM accounts')) return Promise.resolve({ rowCount: 0 }); // Not found
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .delete(`/api/accounts/${mockAccountId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });
});
