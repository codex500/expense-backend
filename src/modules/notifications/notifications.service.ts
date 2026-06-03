/**
 * Notifications service — in-app notification CRUD.
 */

import { query } from '../../config/database';

export class NotificationsService {

  async list(userId: string, limit: number = 20) {
    const { rows } = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return rows.map(this.format);
  }

  async getUnreadCount(userId: string) {
    const { rows } = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return { unreadCount: Number(rows[0].count) };
  }

  async create(userId: string, type: string, title: string, message: string, data?: Record<string, unknown>) {
    const { rows: [notif] } = await query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    return this.format(notif);
  }

  async markAsRead(userId: string, notifId: string) {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [notifId, userId]
    );
    return { message: 'Notification marked as read.' };
  }

  async markAllAsRead(userId: string) {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return { message: 'All notifications marked as read.' };
  }

  private format(row: Record<string, unknown>) {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  async markAsUnread(userId: string, notifId: string) {
    await query(
      'UPDATE notifications SET is_read = false WHERE id = $1 AND user_id = $2',
      [notifId, userId]
    );
    return { message: 'Notification marked as unread.' };
  }

  async delete(userId: string, notifId: string) {
    await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notifId, userId]
    );
    return { message: 'Notification deleted.' };
  }
}

export const notificationsService = new NotificationsService();
