"use strict";
/**
 * Analytics controller + routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_service_1 = require("./analytics.service");
const response_1 = require("../../shared/utils/response");
const authenticate_1 = require("../../shared/middleware/authenticate");
class AnalyticsController {
    async dashboard(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.getDashboard(req.user.id));
        }
        catch (err) {
            next(err);
        }
    }
    async expenseByCategory(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.expenseByCategory(req.user.id, startDate, endDate));
        }
        catch (err) {
            next(err);
        }
    }
    async expenseByAccount(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.expenseByAccount(req.user.id, startDate, endDate));
        }
        catch (err) {
            next(err);
        }
    }
    async monthlyGraph(req, res, next) {
        try {
            const months = parseInt(req.query.months) || 6;
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.monthlyGraph(req.user.id, months));
        }
        catch (err) {
            next(err);
        }
    }
    async weeklyGraph(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.weeklyGraph(req.user.id));
        }
        catch (err) {
            next(err);
        }
    }
    async paymentMethodUsage(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.paymentMethodUsage(req.user.id, startDate, endDate));
        }
        catch (err) {
            next(err);
        }
    }
    async sixMonthComparison(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.sixMonthComparison(req.user.id));
        }
        catch (err) {
            next(err);
        }
    }
    async spendingTrend(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await analytics_service_1.analyticsService.spendingTrend(req.user.id));
        }
        catch (err) {
            next(err);
        }
    }
}
const ctrl = new AnalyticsController();
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.get('/dashboard', (req, res, next) => ctrl.dashboard(req, res, next));
router.get('/expense-by-category', (req, res, next) => ctrl.expenseByCategory(req, res, next));
router.get('/expense-by-account', (req, res, next) => ctrl.expenseByAccount(req, res, next));
router.get('/monthly', (req, res, next) => ctrl.monthlyGraph(req, res, next));
router.get('/weekly', (req, res, next) => ctrl.weeklyGraph(req, res, next));
router.get('/payment-methods', (req, res, next) => ctrl.paymentMethodUsage(req, res, next));
router.get('/six-month', (req, res, next) => ctrl.sixMonthComparison(req, res, next));
router.get('/spending-trend', (req, res, next) => ctrl.spendingTrend(req, res, next));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map