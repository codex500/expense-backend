/**
 * JWT Authentication middleware
 * Expects: Authorization: Bearer <token>
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization header must be: Bearer <token>.' });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Token invalid.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    next(err);
  }
}

module.exports = { authenticate };
