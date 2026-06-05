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

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, token } = req.body;
      const result = await authService.verifyEmail(email, token);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshSession(refreshToken);
      sendSuccess(res, result, 'Token refreshed.');
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await authService.logout(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, password } = req.body;
      const result = await authService.resetPassword(accessToken, password);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await authService.updateProfile(authReq.user.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getOAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as 'google';
      const redirectUrl = (req.query.redirect as string) || `${env.APP_URL}auth/callback`;
      const result = await authService.getOAuthUrl(provider, redirectUrl);
      res.redirect(result.url);
    } catch (err) { next(err); }
  }

  async completeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await authService.completeOnboarding(authReq.user.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await authService.getSession(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const result = await authService.deleteAccount(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { token, deviceType } = req.body;
      const result = await authService.registerDeviceToken(authReq.user.id, token, deviceType);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async removeDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { token } = req.body;
      const result = await authService.removeDeviceToken(authReq.user.id, token);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  // --- Passkey Methods ---
  async generateRegistrationOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.generateRegistrationOptions(authReq.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async verifyRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.verifyRegistration(authReq.user.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async generateAuthenticationOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.generateAuthenticationOptions(email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async verifyAuthentication(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, response } = req.body;
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.verifyAuthentication(email, response);
      sendSuccess(res, result, 'Login successful with Passkey.');
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
