"use strict";
/**
 * Auth controller — handles HTTP requests for authentication endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
const env_1 = require("../../config/env");
class AuthController {
    async signup(req, res, next) {
        try {
            const result = await auth_service_1.authService.signup(req.body);
            (0, response_1.sendCreated)(res, result, 'Account created. Please check your email for verification.');
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            (0, response_1.sendSuccess)(res, result, 'Login successful.');
        }
        catch (err) {
            next(err);
        }
    }
    async logout(req, res, next) {
        try {
            const token = req.headers.authorization?.slice(7) || '';
            const result = await auth_service_1.authService.logout(token);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const redirectUrl = env_1.env.APP_URL;
            const result = await auth_service_1.authService.forgotPassword(req.body.email, redirectUrl);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { accessToken, password } = req.body;
            const result = await auth_service_1.authService.resetPassword(accessToken, password);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const { email, otp } = req.body;
            const result = await auth_service_1.authService.verifyOtp(email, otp);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async resendOtp(req, res, next) {
        try {
            const result = await auth_service_1.authService.resendOtp(req.body.email);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const result = await auth_service_1.authService.updateProfile(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getOAuthUrl(req, res, next) {
        try {
            const provider = req.params.provider;
            const redirectUrl = req.query.redirect || `${env_1.env.APP_URL}/auth/callback`;
            const result = await auth_service_1.authService.getOAuthUrl(provider, redirectUrl);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async completeOnboarding(req, res, next) {
        try {
            const result = await auth_service_1.authService.completeOnboarding(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getSession(req, res, next) {
        try {
            const result = await auth_service_1.authService.getSession(req.user.id);
            console.log('[DEBUG] getSession API response:', result);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteAccount(req, res, next) {
        try {
            const result = await auth_service_1.authService.deleteAccount(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map