"use strict";
/**
 * Response helpers — consistent API response formatting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendPaginated = sendPaginated;
exports.sendError = sendError;
exports.sendCreated = sendCreated;
exports.sendNoContent = sendNoContent;
exports.buildPaginationMeta = buildPaginationMeta;
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    const response = {
        success: true,
        message,
        data,
    };
    res.status(statusCode).json(response);
}
function sendPaginated(res, data, meta, message = 'Success') {
    const response = {
        success: true,
        message,
        data,
        meta,
    };
    res.status(200).json(response);
}
function sendError(res, message, statusCode = 500, code) {
    const response = {
        success: false,
        message,
        ...(code && { data: { code } }),
    };
    res.status(statusCode).json(response);
}
function sendCreated(res, data, message = 'Created successfully') {
    sendSuccess(res, data, message, 201);
}
function sendNoContent(res) {
    res.status(204).send();
}
/**
 * Build pagination meta from total count and query params.
 */
function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
//# sourceMappingURL=response.js.map