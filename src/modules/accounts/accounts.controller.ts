/**
 * Accounts controller
 */

import { Response, NextFunction } from 'express';
import { accountsService } from './accounts.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class AccountsController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.create(req.user.id, req.body);
      sendCreated(res, result, 'Account created.');
    } catch (err) { next(err); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.update(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, result, 'Account updated.');
    } catch (err) { next(err); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.delete(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.getAll(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.getById(req.user.id, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.getSummary(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async transfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountsService.transfer(req.user.id, req.body);
      sendSuccess(res, result, 'Transfer completed.');
    } catch (err) { next(err); }
  }
}

export const accountsController = new AccountsController();
