/**
 * Global error handling middleware
 * Returns consistent JSON error responses and logs server errors
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

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

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
}

module.exports = errorHandler;
