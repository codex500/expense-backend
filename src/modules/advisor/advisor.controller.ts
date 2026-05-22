import { Request, Response, NextFunction } from 'express';
import { advisorService } from './advisor.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class AdvisorController {
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await advisorService.getInsights(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const advisorController = new AdvisorController();