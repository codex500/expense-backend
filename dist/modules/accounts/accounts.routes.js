"use strict";
/**
 * Accounts routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accounts_controller_1 = require("./accounts.controller");
const authenticate_1 = require("../../shared/middleware/authenticate");
const validate_1 = require("../../shared/middleware/validate");
const accounts_validation_1 = require("./accounts.validation");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.post('/', (0, validate_1.validate)({ body: accounts_validation_1.createAccountSchema }), (req, res, next) => accounts_controller_1.accountsController.create(req, res, next));
router.get('/', (req, res, next) => accounts_controller_1.accountsController.getAll(req, res, next));
router.get('/summary', (req, res, next) => accounts_controller_1.accountsController.getSummary(req, res, next));
router.get('/:id', (0, validate_1.validate)({ params: accounts_validation_1.accountIdParam }), (req, res, next) => accounts_controller_1.accountsController.getById(req, res, next));
router.put('/:id', (0, validate_1.validate)({ params: accounts_validation_1.accountIdParam, body: accounts_validation_1.updateAccountSchema }), (req, res, next) => accounts_controller_1.accountsController.update(req, res, next));
router.delete('/:id', (0, validate_1.validate)({ params: accounts_validation_1.accountIdParam }), (req, res, next) => accounts_controller_1.accountsController.delete(req, res, next));
router.post('/transfer', (0, validate_1.validate)({ body: accounts_validation_1.transferSchema }), (req, res, next) => accounts_controller_1.accountsController.transfer(req, res, next));
exports.default = router;
//# sourceMappingURL=accounts.routes.js.map