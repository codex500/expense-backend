import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await notificationsService.list(authReq.user.id, limit);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await notificationsService.getUnreadCount(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await notificationsService.markAsRead(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await notificationsService.markAllAsRead(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async markAsUnread(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await notificationsService.markAsUnread(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await notificationsService.delete(authReq.user.id, req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const notificationsController = new NotificationsController();
