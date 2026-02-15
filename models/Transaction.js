/**
 * Transaction model - income/expense CRUD and aggregations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new transaction
 */
async function create({ userId, type, amount, category, paymentMethod, note, transactionDate }) {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO transactions (id, user_id, type, amount, category, payment_method, note, transaction_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, userId, type, amount, category, paymentMethod || null, note || null, transactionDate]
  );
  return result.rows[0];
}

/**
 * Get transaction by ID and user (ensures ownership)
 */
async function findByIdAndUser(transactionId, userId) {
  const result = await pool.query(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [transactionId, userId]
  );
  return result.rows[0];
}

/**
 * Get all transactions for a user with optional filters
 */
async function findAllByUser(userId, filters = {}) {
  let query = 'SELECT * FROM transactions WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;

  if (filters.type) {
    query += ` AND type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }
  if (filters.category) {
    query += ` AND category = $${paramIndex}`;
    params.push(filters.category);
    paramIndex++;
  }
  if (filters.startDate) {
    query += ` AND transaction_date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    query += ` AND transaction_date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  query += ' ORDER BY transaction_date DESC, created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Update a transaction (only if owned by user)
 */
async function update(transactionId, userId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  const allowed = ['type', 'amount', 'category', 'payment_method', 'note', 'transaction_date'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${i}`);
      values.push(updates[key]);
      i++;
    }
  }
  if (fields.length === 0) return null;
  values.push(transactionId, userId);
  const result = await pool.query(
    `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rows[0];
}

/**
 * Delete a transaction (only if owned by user)
 */
async function remove(transactionId, userId) {
  const result = await pool.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [transactionId, userId]
  );
  return result.rows[0];
}

/**
 * Sum amounts by type for a user (optionally within date range)
 */
async function sumByType(userId, type, startDate = null, endDate = null) {
  let query = 'SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = $1 AND type = $2';
  const params = [userId, type];
  if (startDate) {
    params.push(startDate);
    query += ` AND transaction_date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    query += ` AND transaction_date <= $${params.length}`;
  }
  const result = await pool.query(query, params);
  return parseFloat(result.rows[0].total);
}

/**
 * Total income for user (all time or date range)
 */
async function totalIncome(userId, startDate = null, endDate = null) {
  return sumByType(userId, 'income', startDate, endDate);
}

/**
 * Total expense for user (all time or date range)
 */
async function totalExpense(userId, startDate = null, endDate = null) {
  return sumByType(userId, 'expense', startDate, endDate);
}

/**
 * Get category-wise expense for a user (for pie chart)
 */
async function expenseByCategory(userId, startDate = null, endDate = null) {
  let query = `SELECT category, COALESCE(SUM(amount), 0) AS total
               FROM transactions WHERE user_id = $1 AND type = 'expense'`;
  const params = [userId];
  if (startDate) {
    params.push(startDate);
    query += ` AND transaction_date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    query += ` AND transaction_date <= $${params.length}`;
  }
  query += ' GROUP BY category ORDER BY total DESC';
  const result = await pool.query(query, params);
  return result.rows.map((r) => ({ category: r.category || 'Uncategorized', total: parseFloat(r.total) }));
}

/**
 * Get monthly spending (for graph) - last N months
 */
async function monthlySpending(userId, months = 12) {
  const result = await pool.query(
    `SELECT DATE_TRUNC('month', transaction_date) AS month, COALESCE(SUM(amount), 0) AS total
     FROM transactions WHERE user_id = $1 AND type = 'expense'
     AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * $2
     GROUP BY DATE_TRUNC('month', transaction_date)
     ORDER BY month ASC`,
    [userId, months]
  );
  return result.rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total: parseFloat(r.total),
  }));
}

/**
 * Last 7 days spending per day
 */
async function last7DaysSpending(userId) {
  const result = await pool.query(
    `SELECT transaction_date::date AS day, COALESCE(SUM(amount), 0) AS total
     FROM transactions WHERE user_id = $1 AND type = 'expense'
     AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
     GROUP BY transaction_date::date ORDER BY day ASC`,
    [userId]
  );
  return result.rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    total: parseFloat(r.total),
  }));
}

module.exports = {
  create,
  findByIdAndUser,
  findAllByUser,
  update,
  remove,
  totalIncome,
  totalExpense,
  expenseByCategory,
  monthlySpending,
  last7DaysSpending,
};
