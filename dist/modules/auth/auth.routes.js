"use strict";
/**
 * Auth routes — public and protected authentication endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const authenticate_1 = require("../../shared/middleware/authenticate");
const validate_1 = require("../../shared/middleware/validate");
const rateLimiter_1 = require("../../shared/middleware/rateLimiter");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
// Public routes
router.post('/signup', rateLimiter_1.authLimiter, (0, validate_1.validate)({ body: auth_validation_1.signupSchema }), (req, res, next) => auth_controller_1.authController.signup(req, res, next));
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validate)({ body: auth_validation_1.loginSchema }), (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.post('/forgot-password', rateLimiter_1.emailLimiter, (0, validate_1.validate)({ body: auth_validation_1.forgotPasswordSchema }), (req, res, next) => auth_controller_1.authController.forgotPassword(req, res, next));
router.post('/reset-password', (0, validate_1.validate)({ body: auth_validation_1.resetPasswordSchema }), (req, res, next) => auth_controller_1.authController.resetPassword(req, res, next));
router.post('/verify-otp', rateLimiter_1.authLimiter, (req, res, next) => auth_controller_1.authController.verifyOtp(req, res, next));
router.post('/resend-otp', rateLimiter_1.emailLimiter, (req, res, next) => auth_controller_1.authController.resendOtp(req, res, next));
router.get('/oauth/:provider', (req, res, next) => auth_controller_1.authController.getOAuthUrl(req, res, next));
// Protected routes
router.post('/logout', authenticate_1.authenticate, (req, res, next) => auth_controller_1.authController.logout(req, res, next));
router.get('/session', authenticate_1.authenticate, (req, res, next) => auth_controller_1.authController.getSession(req, res, next));
router.post('/onboarding', authenticate_1.authenticate, (0, validate_1.validate)({ body: auth_validation_1.onboardingSchema }), (req, res, next) => auth_controller_1.authController.completeOnboarding(req, res, next));
router.put('/profile', authenticate_1.authenticate, (req, res, next) => auth_controller_1.authController.updateProfile(req, res, next));
router.delete('/account', authenticate_1.authenticate, (req, res, next) => auth_controller_1.authController.deleteAccount(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map