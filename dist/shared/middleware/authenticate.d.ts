/**
 * Authentication middleware — validates Supabase JWT tokens.
 * Attaches the authenticated user to req.user.
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authenticate.d.ts.map