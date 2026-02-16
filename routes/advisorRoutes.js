/**
 * Advisor routes - smart spending insights (protected)
 */

const express = require('express');
const router = express.Router();
const advisorController = require('../controllers/advisorController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', advisorController.getAdvisor);

module.exports = router;
