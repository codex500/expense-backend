import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/authenticate';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => notificationsController.list(req, res, next));
router.get('/unread-count', (req, res, next) => notificationsController.getUnreadCount(req, res, next));
router.put('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));
router.put('/:id/unread', (req, res, next) => notificationsController.markAsUnread(req, res, next));
router.put('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationsController.delete(req, res, next));
router.post('/test-push', (req, res, next) => notificationsController.sendTest(req, res, next));
router.post('/admin/broadcast', requireAdmin, (req, res, next) => notificationsController.adminBroadcast(req, res, next));

export default router;
