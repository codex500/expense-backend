/**
 * Budget routes - set budget, get status with 80% warning (protected)
 */

const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.put('/', budgetController.setBudget);
router.get('/status', budgetController.getBudgetStatus);

module.exports = router;
