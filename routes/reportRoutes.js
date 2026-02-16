/**
 * Report routes - PDF generation (protected)
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/monthly', reportController.getMonthlyReport);

module.exports = router;
