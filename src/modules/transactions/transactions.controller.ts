import { Request, Response, NextFunction } from 'express';
import { transactionsService } from './transactions.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class TransactionsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await transactionsService.list(authReq.user.id, req.query as any);
      sendPaginated(res, result.transactions, result.meta);
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await transactionsService.getById(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await transactionsService.create(authReq.user.id, req.body);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await transactionsService.update(authReq.user.id, req.params.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await transactionsService.delete(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const transactionsController = new TransactionsController();
