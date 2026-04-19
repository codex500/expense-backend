"use strict";
/**
 * Budgets controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetsController = exports.BudgetsController = void 0;
const budgets_service_1 = require("./budgets.service");
const response_1 = require("../../shared/utils/response");
class BudgetsController {
    async create(req, res, next) {
        try {
            const result = await budgets_service_1.budgetsService.create(req.user.id, req.body);
            (0, response_1.sendCreated)(res, result, 'Budget created.');
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const result = await budgets_service_1.budgetsService.update(req.user.id, req.params.id, req.body);
            (0, response_1.sendSuccess)(res, result, 'Budget updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await budgets_service_1.budgetsService.delete(req.user.id, req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getCurrent(req, res, next) {
        try {
            const result = await budgets_service_1.budgetsService.getCurrent(req.user.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BudgetsController = BudgetsController;
exports.budgetsController = new BudgetsController();
//# sourceMappingURL=budgets.controller.js.map