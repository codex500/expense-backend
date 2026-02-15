/**
 * Category controller - CRUD for user-defined categories
 */

const Category = require('../models/Category');
const { validateCategory } = require('../utils/validation');

/**
 * POST /api/categories
 * Create a category
 */
async function createCategory(req, res, next) {
  try {
    const errors = validateCategory(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const { name, type } = req.body;
    const category = await Category.create({
      userId: req.user.id,
      name: name.trim(),
      type,
    });
    res.status(201).json({
      success: true,
      message: 'Category created.',
      data: { category },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/categories
 * List categories (optional query: type = income | expense)
 */
async function getCategories(req, res, next) {
  try {
    const type = req.query.type && (req.query.type === 'income' || req.query.type === 'expense')
      ? req.query.type
      : null;
    const categories = await Category.findByUser(req.user.id, type);
    res.json({
      success: true,
      data: { categories, count: categories.length },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/categories/:id
 */
async function getCategoryById(req, res, next) {
  try {
    const category = await Category.findByIdAndUser(req.params.id, req.user.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/categories/:id
 */
async function updateCategory(req, res, next) {
  try {
    const errors = validateCategory(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const category = await Category.update(req.params.id, req.user.id, {
      name: req.body.name ? req.body.name.trim() : undefined,
      type: req.body.type,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({
      success: true,
      message: 'Category updated.',
      data: { category },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    const deleted = await Category.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({
      success: true,
      message: 'Category deleted.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
