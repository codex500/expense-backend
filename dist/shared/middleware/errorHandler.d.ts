/**
 * Global error handler — catches all errors, returns consistent JSON responses.
 * Never exposes internal error details in production.
 */
import { Request, Response, NextFunction } from 'express';
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map