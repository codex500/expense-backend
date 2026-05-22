import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => analyticsController.getAnalytics(req, res, next));
router.get('/category', (req, res, next) => analyticsController.getCategoryAnalytics(req, res, next));
router.get('/monthly', (req, res, next) => analyticsController.getMonthlyAnalytics(req, res, next));
router.get('/weekly', (req, res, next) => analyticsController.getWeeklyAnalytics(req, res, next));

export default router;
