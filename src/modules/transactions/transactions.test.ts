import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { query } from '../../config/database';
import { transactionsService } from './transactions.service';

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    query: vi.fn(),
    release: vi.fn(),
  }
}));

vi.mock('../../shared/middleware/authenticate', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'user-123' };
    next();
  }),
}));

vi.mock('../../config/database', () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (cb) => cb(mockClient)),
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  }
}));

describe('Transactions Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/transactions/:id', () => {
    it('should return 404 if not found', async () => {
      (query as any).mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(404);
    });

    it('should return transaction if found', async () => {
      (query as any).mockResolvedValueOnce({
        rows: [{ id: 'txn-1', amount_paise: 1000, type: 'expense', user_id: 'user-123', account_id: 'acc-1' }],
      });
      const res = await request(app).get('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('txn-1');
    });
  });

  describe('GET /api/transactions', () => {
    it('should list transactions with filters', async () => {
      (query as any)
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }) // count query
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'expense', user_id: 'user-123', account_id: 'acc-1' }] }); // data query

      const res = await request(app).get('/api/transactions?type=expense&category=Food&accountId=123e4567-e89b-12d3-a456-426614174000&startDate=2023-01-01&endDate=2023-12-31&minAmountPaise=100&maxAmountPaise=2000&search=lunch');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
    
    it('should handle sort options', async () => {
      (query as any)
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }) 
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000 }] }); 

      const res = await request(app).get('/api/transactions?sortBy=amount_paise&sortOrder=ASC');
      expect(res.status).toBe(200);
    });

    it('should handle another sort option', async () => {
      (query as any)
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }) 
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000 }] }); 

      const res = await request(app).get('/api/transactions?sortBy=created_at');
      expect(res.status).toBe(200);
    });

    it('should handle controller errors', async () => {
      (query as any).mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create an expense transaction successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }) // select account
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'expense' }] }) // insert txn
        .mockResolvedValueOnce({ rows: [] }); // update account

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'expense', category: 'Food', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should fail expense if account not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'expense', category: 'Food', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(404);
    });

    it('should fail expense if insufficient balance', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 500, user_id: 'user-123' }] });

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'expense', category: 'Food', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(400); // InsufficientBalanceError
      expect(res.body.message).toMatch(/Insufficient balance/);
    });

    it('should create income transaction successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }) 
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income' }] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'income', category: 'Salary', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(201);
    });

    it('should create transfer transaction successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }) 
        .mockResolvedValueOnce({ rows: [{ id: 'acc-2' }] }) // destination
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'transfer' }] }) 
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'transfer', transferToAccountId: '223e4567-e89b-12d3-a456-426614174000', category: 'Tr', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(201);
    });

    it('should fail transfer if no destination', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }); 

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'transfer', category: 'Tr', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(400);
    });
    
    it('should fail transfer if destination same as source', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }); 

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'transfer', transferToAccountId: '123e4567-e89b-12d3-a456-426614174000', category: 'Tr', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(400);
    });

    it('should fail transfer if destination not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }) 
        .mockResolvedValueOnce({ rows: [] }); // destination not found

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'transfer', transferToAccountId: '223e4567-e89b-12d3-a456-426614174000', category: 'Tr', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(404);
    });
    
    it('should fail transfer if insufficient balance', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 500, user_id: 'user-123' }] }); 

      const res = await request(app)
        .post('/api/transactions')
        .send({ accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'transfer', transferToAccountId: '223e4567-e89b-12d3-a456-426614174000', category: 'Tr', amountPaise: 1000, transactionDate: '2023-10-10' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete income transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1' }] }) // lock account
        .mockResolvedValueOnce({ rows: [] }) // update
        .mockResolvedValueOnce({ rows: [] }); // delete

      const res = await request(app).delete('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(200);
    });

    it('should delete expense transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'expense', account_id: 'acc-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1' }] }) 
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const res = await request(app).delete('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(200);
    });

    it('should delete transfer transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'transfer', account_id: 'acc-1', transfer_to_account_id: 'acc-2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1' }] }) 
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const res = await request(app).delete('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(200);
    });

    it('should return 404 if txn not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete('/api/transactions/123e4567-e89b-12d3-a456-426614174000');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update successfully (income -> expense)', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 5000 }] };
        }
        if (sql.includes('UPDATE transactions')) {
          return { rows: [{ id: 'txn-1', amount_paise: 2000, type: 'expense' }] };
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'expense', amountPaise: 2000 });
      expect(res.status).toBe(200);
    });
    
    it('should fail update if txn not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'expense', amountPaise: 2000 });
      expect(res.status).toBe(404);
    });

    it('should update successfully (expense -> income)', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'expense', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('UPDATE transactions')) {
          return { rows: [{ id: 'txn-1', amount_paise: 2000, type: 'income' }] };
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'income', amountPaise: 2000 });
      expect(res.status).toBe(200);
    });

    it('should update successfully (transfer -> transfer)', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'transfer', account_id: 'acc-1', transfer_to_account_id: 'acc-2' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          // It needs 3 accounts: source, old dest, new dest
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }, { id: 'acc-2', current_balance_paise: 1000 }, { id: '223e4567-e89b-12d3-a456-426614174000', current_balance_paise: 0 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 5000 }] };
        }
        if (sql.includes('UPDATE transactions')) {
          return { rows: [{ id: 'txn-1', amount_paise: 2000, type: 'transfer' }] };
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'transfer', amountPaise: 2000, transferToAccountId: '223e4567-e89b-12d3-a456-426614174000' });
      expect(res.status).toBe(200);
    });
    
    it('should fail update if transfer missing dest', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 5000 }] };
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'transfer', amountPaise: 2000 });
      expect(res.status).toBe(400); // Bad Request missing dest
    });

    it('should fail update if insufficient balance', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 10 }] }; // NOT ENOUGH
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'expense', amountPaise: 20000 });
      expect(res.status).toBe(400);
    });
    
    it('should fail update if account missing in db for lock', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [] }; // missing
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({ type: 'expense', amountPaise: 20000 });
      expect(res.status).toBe(404);
    });
    
    it('should update without any changes gracefully', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 5000 }] };
        }
        return { rows: [] };
      });

      const res = await request(app).put('/api/transactions/123e4567-e89b-12d3-a456-426614174000').send({});
      expect(res.status).toBe(200);
    });
  });

  describe('Service Edge Cases', () => {
    it('should hit unknown type branches', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'acc-1', current_balance_paise: 5000, user_id: 'user-123' }] }) 
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1', amount_paise: 1000, type: 'unknown' }] }); 

      await transactionsService.create('user-123', { accountId: '123e4567-e89b-12d3-a456-426614174000', type: 'unknown' as any, category: 'Food', amountPaise: 1000, transactionDate: '2023-10-10', isRecurring: false });
    });

    it('should hit transfer branch without transfer_to_account_id on update', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          // oldTxn is transfer but missing dest id
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'transfer', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('SELECT current_balance_paise FROM accounts WHERE id')) {
          return { rows: [{ current_balance_paise: 5000 }] };
        }
        if (sql.includes('UPDATE transactions')) {
          return { rows: [{ id: 'txn-1', amount_paise: 2000, type: 'expense' }] };
        }
        return { rows: [] };
      });

      await transactionsService.update('user-123', 'txn-1', { type: 'expense', amountPaise: 2000 });
    });

    it('should hit transfer branch without transfer_to_account_id on delete', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'transfer', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT id FROM accounts WHERE id')) {
          return { rows: [{ id: 'acc-1' }] };
        }
        return { rows: [] };
      });
      await transactionsService.delete('user-123', 'txn-1');
    });

    it('should hit unknown newType branch on update', async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM transactions WHERE id')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'income', account_id: 'acc-1' }] };
        }
        if (sql.includes('SELECT * FROM accounts WHERE id = ANY')) {
          return { rows: [{ id: 'acc-1', current_balance_paise: 5000 }] };
        }
        if (sql.includes('UPDATE transactions')) {
          return { rows: [{ id: 'txn-1', amount_paise: 1000, type: 'unknown' }] };
        }
        return { rows: [] };
      });

      await transactionsService.update('user-123', 'txn-1', { type: 'unknown' as any });
    });
  });
});
