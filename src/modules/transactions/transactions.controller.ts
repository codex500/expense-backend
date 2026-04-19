/**
 * Transactions controller
 */

import { Response, NextFunction } from 'express';
import { transactionsService } from './transactions.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class TransactionsController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.create(req.user.id, req.body);
      sendCreated(res, result, 'Transaction created.');
    } catch (err) { next(err); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.update(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, result, 'Transaction updated.');
    } catch (err) { next(err); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.delete(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.getById(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.list(req.user.id, req.query as any);
      sendPaginated(res, result.transactions, result.meta);
    } catch (err) { next(err); }
  }

  async exportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await transactionsService.exportPdf(req.user.id, res);
    } catch (err) { next(err); }
  }
}

export const transactionsController = new TransactionsController();
