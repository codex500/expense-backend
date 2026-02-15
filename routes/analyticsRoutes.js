/**
 * Analytics routes - category expense, monthly spending, last 7 days (protected)
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/category-expense', analyticsController.getCategoryExpense);
router.get('/monthly-spending', analyticsController.getMonthlySpending);
router.get('/last-7-days', analyticsController.getLast7Days);

module.exports = router;
