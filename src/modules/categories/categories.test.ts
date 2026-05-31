import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { query } from '../../config/database';

// Mock the authenticate middleware BEFORE importing app or routes
vi.mock('../../shared/middleware/authenticate', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' };
    next();
  }),
  optionalAuth: vi.fn((req, res, next) => {
    next();
  })
}));

describe('Categories Module Integration Tests', () => {
  const validUUID = 'ca6c7f8a-c637-4d93-b68a-b118b6229b47';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should list categories', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { id: validUUID, user_id: 'test-user-id', name: 'Food', type: 'expense', icon: 'food', color: '#000', is_system: false, is_active: true, created_at: new Date().toISOString() }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const res = await request(app).get('/api/categories');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Food');
    });

    it('should handle database errors', async () => {
      vi.mocked(query).mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const payload = { name: 'Rent', type: 'expense', icon: 'home', color: '#fff' };
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { id: validUUID, user_id: 'test-user-id', name: 'Rent', type: 'expense', icon: 'home', color: '#fff', is_system: false, is_active: true, created_at: new Date().toISOString() }
        ],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const res = await request(app).post('/api/categories').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Rent');
    });

    it('should fallback to default icon and color if missing', async () => {
      const payload = { name: 'Rent', type: 'expense' };
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          { id: validUUID, user_id: 'test-user-id', name: 'Rent', type: 'expense', icon: 'tag', color: '#6366F1', is_system: false, is_active: true, created_at: new Date().toISOString() }
        ],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const res = await request(app).post('/api/categories').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.data.icon).toBe('tag');
      expect(res.body.data.color).toBe('#6366F1');
    });

    it('should fail if missing required fields', async () => {
      const payload = { type: 'expense' };
      const res = await request(app).post('/api/categories').send(payload);
      
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ id: validUUID, user_id: 'test-user-id', is_system: false }],
        rowCount: 1, command: 'SELECT', oid: 0, fields: []
      });
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ id: validUUID, user_id: 'test-user-id', name: 'Updated Food', type: 'expense', icon: 'food', color: '#000', is_system: false, is_active: true, created_at: new Date().toISOString() }],
        rowCount: 1, command: 'UPDATE', oid: 0, fields: []
      });

      const payload = { name: 'Updated Food', type: 'expense', icon: 'food', color: '#000' };
      const res = await request(app).put(`/api/categories/${validUUID}`).send(payload);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Food');
    });

    it('should fail if category is not found or system', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0, command: 'SELECT', oid: 0, fields: []
      });

      const payload = { name: 'Updated Food' };
      const res = await request(app).put(`/api/categories/${validUUID}`).send(payload);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Category not found');
    });

    it('should fail if no fields to update', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ id: validUUID, user_id: 'test-user-id', is_system: false }],
        rowCount: 1, command: 'SELECT', oid: 0, fields: []
      });
      
      const res = await request(app).put(`/api/categories/${validUUID}`).send({});
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No fields to update.');
    });

    it('should fail if ID is invalid', async () => {
      const res = await request(app).put('/api/categories/invalid-id').send({ name: 'Valid' });
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: []
      });

      const res = await request(app).delete(`/api/categories/${validUUID}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail if category not found or system', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: []
      });

      const res = await request(app).delete(`/api/categories/${validUUID}`);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
