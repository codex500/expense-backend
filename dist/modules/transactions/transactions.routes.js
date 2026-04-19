"use strict";
/**
 * Transactions routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactions_controller_1 = require("./transactions.controller");
const authenticate_1 = require("../../shared/middleware/authenticate");
const validate_1 = require("../../shared/middleware/validate");
const transactions_validation_1 = require("./transactions.validation");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.post('/', (0, validate_1.validate)({ body: transactions_validation_1.createTransactionSchema }), (req, res, next) => transactions_controller_1.transactionsController.create(req, res, next));
router.get('/', (0, validate_1.validate)({ query: transactions_validation_1.transactionQuerySchema }), (req, res, next) => transactions_controller_1.transactionsController.list(req, res, next));
router.get('/export/pdf', (req, res, next) => transactions_controller_1.transactionsController.exportPdf(req, res, next));
router.get('/:id', (0, validate_1.validate)({ params: transactions_validation_1.transactionIdParam }), (req, res, next) => transactions_controller_1.transactionsController.getById(req, res, next));
router.put('/:id', (0, validate_1.validate)({ params: transactions_validation_1.transactionIdParam, body: transactions_validation_1.updateTransactionSchema }), (req, res, next) => transactions_controller_1.transactionsController.update(req, res, next));
router.delete('/:id', (0, validate_1.validate)({ params: transactions_validation_1.transactionIdParam }), (req, res, next) => transactions_controller_1.transactionsController.delete(req, res, next));
exports.default = router;
//# sourceMappingURL=transactions.routes.js.map