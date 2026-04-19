/**
 * Auth controller — handles HTTP requests for authentication endpoints.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
export declare class AuthController {
    signup(req: Request, res: Response, next: NextFunction): Promise<void>;
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    resendOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getOAuthUrl(req: Request, res: Response, next: NextFunction): Promise<void>;
    completeOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map