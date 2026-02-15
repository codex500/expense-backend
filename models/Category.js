/**
 * Category model - user-defined categories (income/expense)
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a category for a user
 */
async function create({ userId, name, type }) {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO categories (id, user_id, name, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, userId, name, type]
  );
  return result.rows[0];
}

/**
 * Get all categories for a user (optionally by type)
 */
async function findByUser(userId, type = null) {
  let query = 'SELECT * FROM categories WHERE user_id = $1';
  const params = [userId];
  if (type) {
    query += ' AND type = $2';
    params.push(type);
  }
  query += ' ORDER BY name';
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get category by ID and user
 */
async function findByIdAndUser(categoryId, userId) {
  const result = await pool.query(
    'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
    [categoryId, userId]
  );
  return result.rows[0];
}

/**
 * Update category
 */
async function update(categoryId, userId, { name, type }) {
  const result = await pool.query(
    `UPDATE categories SET name = COALESCE($1, name), type = COALESCE($2, type)
     WHERE id = $3 AND user_id = $4 RETURNING *`,
    [name, type, categoryId, userId]
  );
  return result.rows[0];
}

/**
 * Delete category
 */
async function remove(categoryId, userId) {
  const result = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [categoryId, userId]
  );
  return result.rows[0];
}

module.exports = {
  create,
  findByUser,
  findByIdAndUser,
  update,
  remove,
};
