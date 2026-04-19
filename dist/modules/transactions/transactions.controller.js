"use strict";
/**
 * Transactions controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsController = exports.TransactionsController = void 0;
const transactions_service_1 = require("./transactions.service");
const response_1 = require("../../shared/utils/response");
class TransactionsController {
    async create(req, res, next) {
        try {
            const result = await transactions_service_1.transactionsService.create(req.user.id, req.body);
            (0, response_1.sendCreated)(res, result, 'Transaction created.');
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const result = await transactions_service_1.transactionsService.update(req.user.id, req.params.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Transaction updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await transactions_service_1.transactionsService.delete(req.user.id, req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const result = await transactions_service_1.transactionsService.getById(req.user.id, req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const result = await transactions_service_1.transactionsService.list(req.user.id, req.query);
            (0, response_1.sendPaginated)(res, result.transactions, result.meta);
        }
        catch (err) {
            next(err);
        }
    }
    async exportPdf(req, res, next) {
        try {
            await transactions_service_1.transactionsService.exportPdf(req.user.id, res);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TransactionsController = TransactionsController;
exports.transactionsController = new TransactionsController();
//# sourceMappingURL=transactions.controller.js.map