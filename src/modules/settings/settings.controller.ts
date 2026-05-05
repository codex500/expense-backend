import { Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class SettingsController {
  async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.getSettings(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.updateSettings(req.user.id, req.body);
      sendSuccess(res, result, 'Settings updated.');
    } catch (err) { next(err); }
  }
}

export const settingsController = new SettingsController();
