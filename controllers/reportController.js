/**
 * Report Controller - PDF generation
 */

const pdfService = require('../services/pdfService');
const User = require('../models/User');

/**
 * GET /api/report/monthly
 * Generate and download monthly PDF report
 */
async function getMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { pdfBuffer, chartData } = await pdfService.generateMonthlyReport(userId, user.name);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trackify-report-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Also return chart data as JSON in response header (optional)
    res.setHeader('X-Chart-Data', JSON.stringify(chartData));
    
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMonthlyReport };
