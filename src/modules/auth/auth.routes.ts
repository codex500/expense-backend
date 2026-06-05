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
  refreshSchema,
  onboardingSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from './auth.validation';

const router = Router();

// ─── Public Routes ─────────────────────────────────────
router.post('/signup',
  authLimiter,
  validate({ body: signupSchema }),
  (req, res, next) => authController.signup(req, res, next)
);

router.post('/verify-email',
  authLimiter,
  validate({ body: verifyEmailSchema }),
  (req, res, next) => authController.verifyEmail(req, res, next)
);

router.post('/resend-verification',
  authLimiter,
  validate({ body: resendVerificationSchema }),
  (req, res, next) => authController.resendVerification(req, res, next)
);

router.post('/login',
  authLimiter,
  validate({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next)
);

router.post('/refresh',
  authLimiter,
  validate({ body: refreshSchema }),
  (req, res, next) => authController.refresh(req, res, next)
);

router.post('/forgot-password',
  emailLimiter,
  validate({ body: forgotPasswordSchema }),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post('/reset-password',
  validate({ body: resetPasswordSchema }),
  (req, res, next) => authController.resetPassword(req, res, next)
);

router.get('/oauth/:provider',
  (req, res, next) => authController.getOAuthUrl(req, res, next)
);

// ─── Protected Routes ──────────────────────────────────
router.post('/logout',
  authenticate as any,
  (req, res, next) => authController.logout(req, res, next)
);

router.get('/me',
  authenticate as any,
  (req, res, next) => authController.getMe(req, res, next)
);

router.post('/onboarding',
  authenticate as any,
  validate({ body: onboardingSchema }),
  (req, res, next) => authController.completeOnboarding(req, res, next)
);

router.put('/profile',
  authenticate as any,
  validate({ body: updateProfileSchema }),
  (req, res, next) => authController.updateProfile(req, res, next)
);

router.delete('/account',
  authenticate as any,
  (req, res, next) => authController.deleteAccount(req, res, next)
);

// ─── Device Token Routes ───────────────────────────────
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from './auth.validation';

router.post('/device-token',
  authenticate as any,
  validate({ body: registerDeviceTokenSchema }),
  (req, res, next) => authController.registerDeviceToken(req, res, next)
);

router.delete('/device-token',
  authenticate as any,
  validate({ body: removeDeviceTokenSchema }),
  (req, res, next) => authController.removeDeviceToken(req, res, next)
);

// ─── Passkey Routes ──────────────────────────────────────
router.get('/passkey/register/options',
  authenticate as any,
  (req, res, next) => authController.generateRegistrationOptions(req, res, next)
);

router.post('/passkey/register/verify',
  authenticate as any,
  (req, res, next) => authController.verifyRegistration(req, res, next)
);

router.post('/passkey/authenticate/options',
  (req, res, next) => authController.generateAuthenticationOptions(req, res, next)
);

router.post('/passkey/authenticate/verify',
  (req, res, next) => authController.verifyAuthentication(req, res, next)
);

export default router;
