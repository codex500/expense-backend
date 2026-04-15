/**
 * Budgets controller
 */

import { Response, NextFunction } from 'express';
import { budgetsService } from './budgets.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class BudgetsController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await budgetsService.create(req.user.id, req.body);
      sendCreated(res, result, 'Budget created.');
    } catch (err) { next(err); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await budgetsService.update(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, result, 'Budget updated.');
    } catch (err) { next(err); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await budgetsService.delete(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getCurrent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await budgetsService.getCurrent(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const budgetsController = new BudgetsController();
