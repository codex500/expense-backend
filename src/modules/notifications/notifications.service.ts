/**
 * Notifications service — in-app notification CRUD.
 */

import { query } from '../../config/database';
import { pushService } from '../../services/pushService';

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

  async sendTestPushNotification(userId: string, title: string, body: string, data?: any) {
    const { rows } = await query(
      'SELECT token FROM device_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (rows.length === 0) {
      return { message: 'No active device tokens found for this user.', sentCount: 0 };
    }

    const messages = rows.map(row => ({
      to: row.token,
      sound: 'default',
      priority: 'high',
      title: title || 'Test Notification',
      body: body || 'This is a test notification from the server.',
      data: data || {},
    }));

    await pushService.sendPushNotifications(messages as any);
    
    // Also save it to in-app notifications
    await this.create(userId, 'system', title || 'Test Notification', body || 'This is a test notification from the server.', data);

    return { message: `Test notification sent to ${rows.length} device(s).`, sentCount: rows.length };
  }

  async broadcastPushNotification(title: string, body: string, data?: any) {
    const { rows: users } = await query<any>(
      `SELECT u.id, dt.token as push_token 
       FROM user_profiles u 
       JOIN device_tokens dt ON u.id = dt.user_id AND dt.is_active = true
       WHERE u.notify_push = true`
    );

    if (users.length === 0) {
      return { message: 'No active device tokens found for any user.', sentCount: 0 };
    }

    const messages: any[] = [];
    const uniqueUsers = new Set<string>();

    for (const user of users) {
      if (user.push_token) {
        messages.push({
          to: user.push_token,
          sound: 'default',
          priority: 'high',
          title: title || 'Broadcast Notification',
          body: body,
          data: data || {},
        });
        uniqueUsers.add(user.id);
      }
    }

    if (messages.length > 0) {
      await pushService.sendPushNotifications(messages);
      
      // Also save in-app notifications for all targeted users
      for (const userId of uniqueUsers) {
        await this.create(userId, 'system', title || 'Broadcast Notification', body, data);
      }
    }

    return { message: `Broadcast sent to ${messages.length} device(s) across ${uniqueUsers.size} user(s).`, sentCount: messages.length };
  }
}

export const notificationsService = new NotificationsService();
