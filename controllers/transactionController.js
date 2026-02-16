/**
 * Transaction controller - add, edit, delete, list with filters
 */

const Transaction = require('../models/Transaction');
const { validateTransaction } = require('../utils/validation');
const { updateStreak } = require('../services/streakService');

/**
 * POST /api/transactions
 * Add a new transaction (income or expense)
 */
async function addTransaction(req, res, next) {
  try {
    const errors = validateTransaction(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const { type, amount, category, payment_method, note, transaction_date } = req.body;
    const transactionDate = transaction_date ? new Date(transaction_date) : new Date();
    const row = await Transaction.create({
      userId: req.user.id,
      type,
      amount: Number(amount),
      category: category.trim(),
      paymentMethod: payment_method,
      note: note ? note.trim() : null,
      transactionDate,
    });
    
    // Update streak (fire-and-forget)
    updateStreak(req.user.id, transactionDate.toISOString().slice(0, 10))
      .catch((err) => console.error('[Transaction] Streak update failed:', err.message));
    
    res.status(201).json({
      success: true,
      message: 'Transaction added.',
      data: { transaction: row },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions
 * Get all transactions with optional filters: type, category, startDate, endDate
 */
async function getTransactions(req, res, next) {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filters = {};
    if (type && (type === 'income' || type === 'expense')) filters.type = type;
    if (category) filters.category = category;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    const transactions = await Transaction.findAllByUser(req.user.id, filters);
    res.json({
      success: true,
      data: { transactions, count: transactions.length },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/:id
 * Get single transaction by ID
 */
async function getTransactionById(req, res, next) {
  try {
    const transaction = await Transaction.findByIdAndUser(req.params.id, req.user.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.json({ success: true, data: { transaction } });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/transactions/:id
 * Update a transaction
 */
async function updateTransaction(req, res, next) {
  try {
    const errors = validateTransaction(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const updates = {};
    const { type, amount, category, payment_method, note, transaction_date } = req.body;
    if (type !== undefined) updates.type = type;
    if (amount !== undefined) updates.amount = Number(amount);
    if (category !== undefined) updates.category = category.trim();
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (note !== undefined) updates.note = note ? note.trim() : null;
    if (transaction_date !== undefined) updates.transaction_date = new Date(transaction_date);
    const transaction = await Transaction.update(req.params.id, req.user.id, updates);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.json({
      success: true,
      message: 'Transaction updated.',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
async function deleteTransaction(req, res, next) {
  try {
    const deleted = await Transaction.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.json({
      success: true,
      message: 'Transaction deleted.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
