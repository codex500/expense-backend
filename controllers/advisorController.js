/**
 * Advisor Controller - Smart spending insights
 */

const advisorService = require('../services/advisorService');

/**
 * GET /api/advisor
 * Returns spending insights and tips
 */
async function getAdvisor(req, res, next) {
  try {
    const userId = req.user.id;
    const insights = await advisorService.getAdvisorInsights(userId);
    
    res.json({
      success: true,
      data: insights,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAdvisor };
