/**
 * Users controller
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
export declare class UsersController {
    getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const usersController: UsersController;
//# sourceMappingURL=users.controller.d.ts.map