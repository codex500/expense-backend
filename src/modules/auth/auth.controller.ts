/**
 * Auth controller — handles HTTP requests for authentication endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import { env } from '../../config/env';

export class AuthController {

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      sendCreated(res, result, 'Account created. Please check your email for verification.');
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful.');
    } catch (err) { next(err); }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.slice(7) || '';
      const result = await authService.logout(token);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const redirectUrl = `${env.APP_URL}/reset-password`;
      const result = await authService.forgotPassword(req.body.email, redirectUrl);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.slice(7) || '';
      const result = await authService.resetPassword(token, req.body.password);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resendVerification(req.body.email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getOAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as 'google' | 'apple' | 'azure';
      const redirectUrl = (req.query.redirect as string) || `${env.APP_URL}/auth/callback`;
      const result = await authService.getOAuthUrl(provider, redirectUrl);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async completeOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.completeOnboarding(req.user.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.getSession(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
