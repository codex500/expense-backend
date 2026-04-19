/**
 * Custom error classes for structured error handling.
 * Each error type maps to a specific HTTP status code.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code: string;
    constructor(message: string, statusCode: number, code?: string);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
}
export declare class InsufficientBalanceError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare class InternalError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map