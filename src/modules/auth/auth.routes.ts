/**
 * Auth routes — public and protected authentication endpoints.
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { authLimiter, emailLimiter } from '../../shared/middleware/rateLimiter';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
} from './auth.validation';

const router = Router();

// Public routes
router.post('/signup', authLimiter, validate({ body: signupSchema }), (req, res, next) => authController.signup(req, res, next));
router.post('/login', authLimiter, validate({ body: loginSchema }), (req, res, next) => authController.login(req, res, next));
router.post('/forgot-password', emailLimiter, validate({ body: forgotPasswordSchema }), (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', validate({ body: resetPasswordSchema }), (req, res, next) => authController.resetPassword(req as any, res, next));
router.post('/verify-otp', authLimiter, (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/resend-otp', emailLimiter, (req, res, next) => authController.resendOtp(req, res, next));
router.get('/oauth/:provider', (req, res, next) => authController.getOAuthUrl(req, res, next));

// Protected routes
router.post('/logout', authenticate as any, (req, res, next) => authController.logout(req as any, res, next));
router.get('/me', authenticate as any, (req, res, next) => authController.getMe(req as any, res, next));
router.post('/onboarding', authenticate as any, validate({ body: onboardingSchema }), (req, res, next) => authController.completeOnboarding(req as any, res, next));
router.put('/profile', authenticate as any, (req, res, next) => authController.updateProfile(req as any, res, next));
router.delete('/account', authenticate as any, (req, res, next) => authController.deleteAccount(req as any, res, next));

// Passkey Routes
router.post('/passkey/register', authenticate as any, (req, res, next) => authController.registerPasskey(req as any, res, next));
router.post('/passkey/verify-registration', authenticate as any, (req, res, next) => authController.verifyPasskeyRegistration(req as any, res, next));
router.post('/passkey/generate-auth', (req, res, next) => authController.generatePasskeyAuth(req as any, res, next));
router.post('/passkey/verify-auth', (req, res, next) => authController.verifyPasskeyAuth(req as any, res, next));
router.delete('/passkey/remove', authenticate as any, (req, res, next) => authController.removePasskey(req as any, res, next));

export default router;
