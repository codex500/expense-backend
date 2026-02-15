/**
 * Request validation utilities
 * Email, amount, required fields
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Validate amount is a positive number
 */
function isValidAmount(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

/**
 * Check string is non-empty (after trim)
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate register body: name, email, password required; email format; optional monthly_budget
 */
function validateRegister(body) {
  const errors = [];
  if (!isNonEmptyString(body.name)) errors.push('Name is required and cannot be empty.');
  if (!isNonEmptyString(body.email)) errors.push('Email is required.');
  else if (!isValidEmail(body.email)) errors.push('Invalid email format.');
  if (!isNonEmptyString(body.password)) errors.push('Password is required and cannot be empty.');
  if (body.password && body.password.length < 6) errors.push('Password must be at least 6 characters.');
  if (body.monthly_budget !== undefined) {
    const n = Number(body.monthly_budget);
    if (!Number.isFinite(n) || n < 0) errors.push('Monthly budget must be a non-negative number.');
  }
  return errors;
}

/**
 * Validate login body: email, password
 */
function validateLogin(body) {
  const errors = [];
  if (!isNonEmptyString(body.email)) errors.push('Email is required.');
  else if (!isValidEmail(body.email)) errors.push('Invalid email format.');
  if (!isNonEmptyString(body.password)) errors.push('Password is required.');
  return errors;
}

/**
 * Validate transaction body (add/edit): type, amount, category; optional note, payment_method, transaction_date
 */
function validateTransaction(body, isUpdate = false) {
  const errors = [];
  const type = body.type;
  if (!isUpdate || type !== undefined) {
    if (type !== 'income' && type !== 'expense') errors.push('Type must be "income" or "expense".');
  }
  if (!isUpdate || body.amount !== undefined) {
    if (!isValidAmount(body.amount)) errors.push('Amount must be a positive number.');
  }
  if (!isUpdate || body.category !== undefined) {
    if (!isNonEmptyString(body.category)) errors.push('Category is required and cannot be empty.');
  }
  if (body.transaction_date !== undefined && body.transaction_date !== null && body.transaction_date !== '') {
    const d = new Date(body.transaction_date);
    if (Number.isNaN(d.getTime())) errors.push('Invalid transaction_date.');
  }
  return errors;
}

/**
 * Validate budget body: monthly_budget >= 0
 */
function validateBudget(body) {
  const errors = [];
  const n = Number(body.monthly_budget);
  if (!Number.isFinite(n) || n < 0) errors.push('Monthly budget must be a non-negative number.');
  return errors;
}

/**
 * Validate category body: name, type
 */
function validateCategory(body, isUpdate = false) {
  const errors = [];
  if (!isUpdate || body.name !== undefined) {
    if (!isNonEmptyString(body.name)) errors.push('Category name is required.');
  }
  if (!isUpdate || body.type !== undefined) {
    if (body.type !== 'income' && body.type !== 'expense') errors.push('Type must be "income" or "expense".');
  }
  return errors;
}

module.exports = {
  isValidEmail,
  isValidAmount,
  isNonEmptyString,
  validateRegister,
  validateLogin,
  validateTransaction,
  validateBudget,
  validateCategory,
};
