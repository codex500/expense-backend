/**
 * Analytics routes - income & expense analytics (protected)
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/category-expense', analyticsController.getCategoryExpense);
router.get('/category-income', analyticsController.getCategoryIncome);
router.get('/monthly-spending', analyticsController.getMonthlySpending);
router.get('/monthly-income', analyticsController.getMonthlyIncome);
router.get('/monthly-summary', analyticsController.getMonthlySummary);
router.get('/last-7-days', analyticsController.getLast7Days);
router.get('/weekly', analyticsController.getWeekly);

module.exports = router;
