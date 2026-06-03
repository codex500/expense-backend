import { Request, Response, NextFunction } from 'express';
import { budgetsService } from './budgets.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class BudgetsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const month = req.query.month as string | undefined;
      const result = await budgetsService.list(authReq.user.id, month);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await budgetsService.getById(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await budgetsService.upsert(authReq.user.id, req.body);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await budgetsService.update(authReq.user.id, req.params.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await budgetsService.delete(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const budgetsController = new BudgetsController();
