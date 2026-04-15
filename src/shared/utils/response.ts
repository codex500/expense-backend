/**
 * Response helpers — consistent API response formatting.
 */

import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export function sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message: string = 'Success'
): void {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(200).json(response);
}

export function sendError(res: Response, message: string, statusCode: number = 500, code?: string): void {
  const response: ApiResponse = {
    success: false,
    message,
    ...(code && { data: { code } }),
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message: string = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Build pagination meta from total count and query params.
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
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
