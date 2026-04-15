/**
 * Analytics controller + routes
 */

import { Router, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { AuthenticatedRequest } from '../../shared/types';

class AnalyticsController {
  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await analyticsService.getDashboard(req.user.id)); } catch (err) { next(err); }
  }
  async expenseByCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      sendSuccess(res, await analyticsService.expenseByCategory(req.user.id, startDate, endDate));
    } catch (err) { next(err); }
  }
  async expenseByAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      sendSuccess(res, await analyticsService.expenseByAccount(req.user.id, startDate, endDate));
    } catch (err) { next(err); }
  }
  async monthlyGraph(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 6;
      sendSuccess(res, await analyticsService.monthlyGraph(req.user.id, months));
    } catch (err) { next(err); }
  }
  async weeklyGraph(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await analyticsService.weeklyGraph(req.user.id)); } catch (err) { next(err); }
  }
  async paymentMethodUsage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      sendSuccess(res, await analyticsService.paymentMethodUsage(req.user.id, startDate, endDate));
    } catch (err) { next(err); }
  }
  async sixMonthComparison(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await analyticsService.sixMonthComparison(req.user.id)); } catch (err) { next(err); }
  }
  async spendingTrend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await analyticsService.spendingTrend(req.user.id)); } catch (err) { next(err); }
  }
}

const ctrl = new AnalyticsController();
const router = Router();
router.use(authenticate as any);

router.get('/dashboard', (req, res, next) => ctrl.dashboard(req as any, res, next));
router.get('/expense-by-category', (req, res, next) => ctrl.expenseByCategory(req as any, res, next));
router.get('/expense-by-account', (req, res, next) => ctrl.expenseByAccount(req as any, res, next));
router.get('/monthly', (req, res, next) => ctrl.monthlyGraph(req as any, res, next));
router.get('/weekly', (req, res, next) => ctrl.weeklyGraph(req as any, res, next));
router.get('/payment-methods', (req, res, next) => ctrl.paymentMethodUsage(req as any, res, next));
router.get('/six-month', (req, res, next) => ctrl.sixMonthComparison(req as any, res, next));
router.get('/spending-trend', (req, res, next) => ctrl.spendingTrend(req as any, res, next));

export default router;
