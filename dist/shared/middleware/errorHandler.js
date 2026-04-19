"use strict";
/**
 * Global error handler — catches all errors, returns consistent JSON responses.
 * Never exposes internal error details in production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../errors");
const env_1 = require("../../config/env");
function errorHandler(err, _req, res, _next) {
    // Log full error in development, minimal in production
    if (!env_1.env.IS_PRODUCTION) {
        console.error('[ErrorHandler]', err);
    }
    else {
        console.error('[ErrorHandler]', err.message);
    }
    // Handle our custom AppError hierarchy
    if (err instanceof errors_1.ValidationError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            errors: err.errors,
        });
        return;
    }
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
        });
        return;
    }
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: err.errors,
        });
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token.',
            code: 'INVALID_TOKEN',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired.',
            code: 'TOKEN_EXPIRED',
        });
        return;
    }
    // Handle PostgreSQL unique constraint violations
    if (err.code === '23505') {
        res.status(409).json({
            success: false,
            message: 'A record with this data already exists.',
            code: 'DUPLICATE_ENTRY',
        });
        return;
    }
    // Handle PostgreSQL check constraint violations (e.g., negative balance)
    if (err.code === '23514') {
        res.status(400).json({
            success: false,
            message: 'Operation violates data constraints (e.g., insufficient balance).',
            code: 'CONSTRAINT_VIOLATION',
        });
        return;
    }
    // Unknown errors — never expose internals in production
    res.status(500).json({
        success: false,
        message: env_1.env.IS_PRODUCTION ? 'An unexpected error occurred.' : err.message,
        code: 'INTERNAL_ERROR',
    });
}
//# sourceMappingURL=errorHandler.js.map