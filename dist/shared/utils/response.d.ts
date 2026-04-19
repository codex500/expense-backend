/**
 * Response helpers — consistent API response formatting.
 */
import { Response } from 'express';
import { PaginationMeta } from '../types';
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): void;
export declare function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta, message?: string): void;
export declare function sendError(res: Response, message: string, statusCode?: number, code?: string): void;
export declare function sendCreated<T>(res: Response, data: T, message?: string): void;
export declare function sendNoContent(res: Response): void;
/**
 * Build pagination meta from total count and query params.
 */
export declare function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta;
//# sourceMappingURL=response.d.ts.map