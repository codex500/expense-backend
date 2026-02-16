/**
 * Authentication controller - register, login, get current user
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../utils/validation');
const { sendEmail } = require('../utils/mailer');
const { getUserStreak } = require('../services/streakService');

const SALT_ROUNDS = 10;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * POST /api/auth/register
 * Create new user; hash password; return user + token
 */
async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const { name, email, password, monthly_budget } = req.body;
    const existing = await User.findByEmail(email.trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const monthlyBudget = monthly_budget !== undefined ? Number(monthly_budget) : 0;
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      monthlyBudget,
    });
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    // Welcome email (fire-and-forget, never blocks response)
    if (process.env.EMAIL_ENABLED === 'true') {
      sendEmail(
        user.email,
        'Welcome to Trackify! 🎉',
        `Hi ${user.name},\n\nWelcome to Trackify! You're all set to track your expenses and stay on top of your budget.\n\nLog in to get started.`
      ).catch((err) => console.error('[Auth] Welcome email failed:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthly_budget: user.monthly_budget,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Verify password; return user + token
 */
async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const { email, password } = req.body;
    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthly_budget: user.monthly_budget,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Return current logged-in user (requires auth middleware)
 */
async function getMe(req, res, next) {
  try {
    const streak = await getUserStreak(req.user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          monthly_budget: req.user.monthly_budget,
          created_at: req.user.created_at,
          streak: {
            current_streak: streak.current_streak,
            longest_streak: streak.longest_streak,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
};
