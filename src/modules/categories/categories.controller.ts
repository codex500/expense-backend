import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class CategoriesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await categoriesService.list(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await categoriesService.create(authReq.user.id, req.body);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await categoriesService.update(authReq.user.id, req.params.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await categoriesService.delete(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const categoriesController = new CategoriesController();
