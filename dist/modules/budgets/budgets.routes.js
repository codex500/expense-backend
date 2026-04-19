"use strict";
/**
 * Budgets routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budgets_controller_1 = require("./budgets.controller");
const authenticate_1 = require("../../shared/middleware/authenticate");
const validate_1 = require("../../shared/middleware/validate");
const budgets_validation_1 = require("./budgets.validation");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.post('/', (0, validate_1.validate)({ body: budgets_validation_1.createBudgetSchema }), (req, res, next) => budgets_controller_1.budgetsController.create(req, res, next));
router.get('/current', (req, res, next) => budgets_controller_1.budgetsController.getCurrent(req, res, next));
router.put('/:id', (0, validate_1.validate)({ params: budgets_validation_1.budgetIdParam, body: budgets_validation_1.updateBudgetSchema }), (req, res, next) => budgets_controller_1.budgetsController.update(req, res, next));
router.delete('/:id', (0, validate_1.validate)({ params: budgets_validation_1.budgetIdParam }), (req, res, next) => budgets_controller_1.budgetsController.delete(req, res, next));
exports.default = router;
//# sourceMappingURL=budgets.routes.js.map