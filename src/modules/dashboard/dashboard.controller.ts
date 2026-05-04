import { Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

const summaryCache = new NodeCache({ stdTTL: 60 });

export class DashboardController {
  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cacheKey = `dashboard_summary_${req.user.id}`;
      const cachedData = summaryCache.get(cacheKey);

      if (cachedData) {
        return sendSuccess(res, cachedData);
      }

      const result = await dashboardService.getSummary(req.user.id);
      summaryCache.set(cacheKey, result);

      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const dashboardController = new DashboardController();
