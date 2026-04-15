/**
 * Users controller
 */

import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class UsersController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getProfile(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.updateProfile(req.user.id, req.body);
      sendSuccess(res, result, 'Profile updated.');
    } catch (err) { next(err); }
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.updatePreferences(req.user.id, req.body);
      sendSuccess(res, result, 'Preferences updated.');
    } catch (err) { next(err); }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.changePassword(req.user.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.deleteAccount(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const usersController = new UsersController();
