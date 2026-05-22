import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const months = parseInt(req.query.months as string) || 6;
      const result = await analyticsService.getAnalytics(authReq.user.id, months);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getCategoryAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const month = req.query.month as string;
      const result = await analyticsService.getCategoryAnalytics(authReq.user.id, month);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getMonthlyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const months = parseInt(req.query.months as string) || 6;
      const result = await analyticsService.getMonthlyAnalytics(authReq.user.id, months);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getWeeklyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const month = req.query.month as string;
      const result = await analyticsService.getWeeklyAnalytics(authReq.user.id, month);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const analyticsController = new AnalyticsController();
