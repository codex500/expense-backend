"use strict";
/**
 * Notifications service — In-app notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = exports.NotificationsService = void 0;
const database_1 = require("../../config/database");
const express_1 = require("express");
const response_1 = require("../../shared/utils/response");
const authenticate_1 = require("../../shared/middleware/authenticate");
const zod_1 = require("zod");
const validate_1 = require("../../shared/middleware/validate");
class NotificationsService {
    async create(userId, type, title, message, data = {}) {
        const { rows } = await (0, database_1.query)(`INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`, [userId, type, title, message, JSON.stringify(data)]);
        return rows[0];
    }
    async getUserNotifications(userId, limit = 50, offset = 0) {
        const { rows } = await (0, database_1.query)(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        const { rows: unreadCountRows } = await (0, database_1.query)(`SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]);
        return {
            notifications: rows,
            unreadCount: Number(unreadCountRows[0].unread_count)
        };
    }
    async markAsRead(userId, notificationId) {
        await (0, database_1.query)(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
        return { message: 'Marked as read' };
    }
    async markAllAsRead(userId) {
        await (0, database_1.query)(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
        return { message: 'All marked as read' };
    }
}
exports.NotificationsService = NotificationsService;
exports.notificationsService = new NotificationsService();
// --- Controller & Routes ---
const notificationIdParam = zod_1.z.object({ id: zod_1.z.string().uuid() });
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const result = await exports.notificationsService.getUserNotifications(req.user.id, limit, offset);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id/read', (0, validate_1.validate)({ params: notificationIdParam }), async (req, res, next) => {
    try {
        const result = await exports.notificationsService.markAsRead(req.user.id, req.params.id);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
});
router.put('/read-all', async (req, res, next) => {
    try {
        const result = await exports.notificationsService.markAllAsRead(req.user.id);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.module.js.map