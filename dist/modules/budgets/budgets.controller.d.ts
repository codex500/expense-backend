/**
 * Budgets controller
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
export declare class BudgetsController {
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getCurrent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const budgetsController: BudgetsController;
//# sourceMappingURL=budgets.controller.d.ts.map