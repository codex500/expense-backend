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
const mockNotifId = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  vi.clearAllMocks();

  (pool.query as any).mockImplementation((text: string, params: any[]) => {
    // 1. Auth middleware profile check
    if (text.includes('user_profiles')) {
      return Promise.resolve({
        rows: [{ id: mockUserId, email: 'test@example.com', full_name: 'Test User' }]
      });
    }

    // 2. Unread count check
    if (text.includes('COUNT(*) AS count FROM notifications')) {
      return Promise.resolve({ rows: [{ count: '5' }] });
    }

    // 3. Mark as read
    if (text.includes('UPDATE notifications SET is_read = true WHERE id = $1')) {
      return Promise.resolve({ rowCount: 1, rows: [] });
    }

    // 4. Mark all as read
    if (text.includes('UPDATE notifications SET is_read = true WHERE user_id = $1')) {
      return Promise.resolve({ rowCount: 5, rows: [] });
    }

    // 5. List notifications
    if (text.includes('SELECT * FROM notifications')) {
      return Promise.resolve({
        rows: [
          {
            id: mockNotifId,
            user_id: mockUserId,
            type: 'alert',
            title: 'Test Title',
            message: 'Test Message',
            data: null,
            is_read: false,
            created_at: new Date().toISOString(),
          }
        ]
      });
    }

    return Promise.resolve({ rows: [] });
  });
});

describe('Notifications Module', () => {
  describe('GET /api/notifications', () => {
    it('should return a list of notifications', async () => {
      const res = await request(app)
        .get('/api/notifications?limit=10')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(mockNotifId);
      expect(res.body.data[0].type).toBe('alert');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return the unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(5);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${mockNotifId}/read`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Notification marked as read.');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('All notifications marked as read.');
    });
  });
});
