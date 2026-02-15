/**
 * JWT Authentication middleware
 * Protects routes by verifying Bearer token and attaching user to req
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT and set req.user (id, name, email, etc.)
 * Returns 401 if token missing or invalid
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
    next(err);
  }
}

module.exports = { authenticate };
