"use strict";
/**
 * Custom error classes for structured error handling.
 * Each error type maps to a specific HTTP status code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.TooManyRequestsError = exports.InsufficientBalanceError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request', code = 'BAD_REQUEST') {
        super(message, 400, code);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        super(message, 401, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code = 'FORBIDDEN') {
        super(message, 403, code);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflict', code = 'CONFLICT') {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    errors;
    constructor(message = 'Validation failed', errors = {}) {
        super(message, 422, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class InsufficientBalanceError extends AppError {
    constructor(message = 'Insufficient account balance') {
        super(message, 400, 'INSUFFICIENT_BALANCE');
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'TOO_MANY_REQUESTS');
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR');
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=index.js.map