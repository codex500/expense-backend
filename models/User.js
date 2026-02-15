/**
 * User model - CRUD and auth-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new user (password should be hashed before calling)
 */
async function create({ name, email, passwordHash, monthlyBudget = 0 }) {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO users (id, name, email, password, monthly_budget)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, monthly_budget, created_at`,
    [id, name, email, passwordHash, monthlyBudget]
  );
  return result.rows[0];
}

/**
 * Find user by email (for login)
 */
async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password, monthly_budget, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

/**
 * Find user by ID (exclude password)
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, monthly_budget, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

/**
 * Update monthly budget for a user
 */
async function updateMonthlyBudget(userId, monthlyBudget) {
  const result = await pool.query(
    `UPDATE users SET monthly_budget = $1 WHERE id = $2
     RETURNING id, name, email, monthly_budget, created_at`,
    [monthlyBudget, userId]
  );
  return result.rows[0];
}

module.exports = {
  create,
  findByEmail,
  findById,
  updateMonthlyBudget,
};
