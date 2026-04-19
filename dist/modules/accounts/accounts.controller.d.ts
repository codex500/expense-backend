/**
 * Accounts controller
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
export declare class AccountsController {
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    transfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const accountsController: AccountsController;
//# sourceMappingURL=accounts.controller.d.ts.map