"use strict";
/**
 * Users controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = exports.UsersController = void 0;
const users_service_1 = require("./users.service");
const response_1 = require("../../shared/utils/response");
class UsersController {
    async getProfile(req, res, next) {
        try {
            const result = await users_service_1.usersService.getProfile(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const result = await users_service_1.usersService.updateProfile(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Profile updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async updatePreferences(req, res, next) {
        try {
            const result = await users_service_1.usersService.updatePreferences(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Preferences updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const result = await users_service_1.usersService.changePassword(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteAccount(req, res, next) {
        try {
            const result = await users_service_1.usersService.deleteAccount(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UsersController = UsersController;
exports.usersController = new UsersController();
//# sourceMappingURL=users.controller.js.map