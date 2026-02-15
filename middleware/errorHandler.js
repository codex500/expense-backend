/**
 * Global error handling middleware
 * Returns consistent JSON error responses and logs server errors
 */

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('Error:', err.message);
  console.error(err.stack);

  // JWT errors already handled in auth middleware; duplicate here as fallback
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired.',
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists (e.g. email).',
    });
  }

  // PostgreSQL foreign key / not null etc.
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid data for database.',
    });
  }

  // Connection/timeout errors - often DB or network
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || (err.message && err.message.includes('timeout'))) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
    });
  }

  // Table/schema missing (e.g. "relation \"users\" does not exist")
  if (err.code === '42P01' || (err.message && err.message.includes('does not exist'))) {
    return res.status(500).json({
      success: false,
      message: 'Database tables are missing. Run the schema (e.g. npm run db:setup) against your database.',
    });
  }

  const status = err.statusCode || 500;
  const message = status === 500 && !isDev
    ? 'Internal server error.'
    : (err.message || 'Internal server error.');
  res.status(status).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
