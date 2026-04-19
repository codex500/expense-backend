"use strict";
/**
 * Accounts controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsController = exports.AccountsController = void 0;
const accounts_service_1 = require("./accounts.service");
const response_1 = require("../../shared/utils/response");
class AccountsController {
    async create(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.create(req.user.id, req.body);
            (0, response_1.sendCreated)(res, result, 'Account created.');
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.update(req.user.id, req.params.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Account updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.delete(req.user.id, req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getAll(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.getAll(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.getById(req.user.id, req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getSummary(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.getSummary(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async transfer(req, res, next) {
        try {
            const result = await accounts_service_1.accountsService.transfer(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Transfer completed.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AccountsController = AccountsController;
exports.accountsController = new AccountsController();
//# sourceMappingURL=accounts.controller.js.map