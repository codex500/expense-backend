"use strict";
/**
 * Users routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const authenticate_1 = require("../../shared/middleware/authenticate");
const validate_1 = require("../../shared/middleware/validate");
const users_validation_1 = require("./users.validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authenticate_1.authenticate);
router.get('/profile', (req, res, next) => users_controller_1.usersController.getProfile(req, res, next));
router.put('/profile', (0, validate_1.validate)({ body: users_validation_1.updateProfileSchema }), (req, res, next) => users_controller_1.usersController.updateProfile(req, res, next));
router.put('/preferences', (0, validate_1.validate)({ body: users_validation_1.updatePreferencesSchema }), (req, res, next) => users_controller_1.usersController.updatePreferences(req, res, next));
router.post('/change-password', (0, validate_1.validate)({ body: users_validation_1.changePasswordSchema }), (req, res, next) => users_controller_1.usersController.changePassword(req, res, next));
router.delete('/account', (req, res, next) => users_controller_1.usersController.deleteAccount(req, res, next));
exports.default = router;
//# sourceMappingURL=users.routes.js.map