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
      const redirectUrl = env.APP_URL;
      const result = await authService.forgotPassword(req.body.email, redirectUrl);
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

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyOtp(email, otp);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resendOtp(req.body.email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.updateProfile(req.user.id, req.body);
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

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.getSession(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  // Passkey Endpoints
  async registerPasskey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.generateRegistration(req.user.id, req.user.email);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async verifyPasskeyRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { passkeyService } = await import('./passkey.service');
      const { response, deviceName } = req.body;
      const result = await passkeyService.verifyRegistration(req.user.id, response, deviceName);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async generatePasskeyAuth(req: Request, res: Response, next: NextFunction) {
    try {
      // Need user ID for this, so we take email first
      const { email } = req.body;
      const { query } = await import('../../config/database');
      const { rows } = await query('SELECT id FROM user_profiles WHERE email = $1', [email]);
      if (rows.length === 0) throw new Error('User not found');
      
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.generateAuthentication(rows[0].id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async verifyPasskeyAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, response } = req.body;
      const { query } = await import('../../config/database');
      const { rows } = await query('SELECT id FROM user_profiles WHERE email = $1', [email]);
      if (rows.length === 0) throw new Error('User not found');
      
      const { passkeyService } = await import('./passkey.service');
      const result = await passkeyService.verifyAuthentication(rows[0].id, response);
      
      // If verified, generate a new JWT session or use Supabase logic
      // For now, we'll return the success verification
      // In production, we'd need to create a custom token or session
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async removePasskey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { passkeyService } = await import('./passkey.service');
      const { passkeyId } = req.body;
      const result = await passkeyService.removePasskey(req.user.id, passkeyId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.deleteAccount(req.user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
