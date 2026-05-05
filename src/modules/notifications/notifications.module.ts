/**
 * Notifications service — In-app notifications
 */

import { query } from '../../config/database';
import { Router } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { AuthenticatedRequest, NotificationType } from '../../shared/types';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate';

export class NotificationsService {

    async create(userId: string, type: NotificationType, title: string, message: string, data: any = {}) {
        const { rows } = await query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
             [userId, type, title, message, JSON.stringify(data)]
        );
        return rows[0];
    }

    async getUserNotifications(userId: string, limit = 50, offset = 0) {
        const { rows } = await query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        
        const { rows: unreadCountRows } = await query(
            `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        return {
            notifications: rows,
            unreadCount: Number(unreadCountRows[0].unread_count)
        };
    }

    async markRead(userId: string, input: { ids?: string[], all?: boolean }) {
        if (input.all) {
            await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
            return { message: 'All marked as read' };
        }
        
        if (input.ids && input.ids.length > 0) {
            await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2::uuid[])`, [userId, input.ids]);
            return { message: 'Selected notifications marked as read' };
        }
        
        return { message: 'No action taken' };
    }
}

export const notificationsService = new NotificationsService();

// --- Controller & Routes ---
const notificationIdParam = z.object({ id: z.string().uuid() });

const router = Router();
router.use(authenticate as any);

router.get('/', async (req: any, res, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        const result = await notificationsService.getUserNotifications(req.user.id, limit, offset);
        sendSuccess(res, result);
    } catch(err) { next(err); }
});

const markReadSchema = z.object({
    ids: z.array(z.string().uuid()).optional(),
    all: z.boolean().optional(),
});

router.patch('/read', validate({ body: markReadSchema }), async (req: any, res, next) => {
    try {
        const result = await notificationsService.markRead(req.user.id, req.body);
        sendSuccess(res, result);
    } catch(err) { next(err); }
});

export default router;
