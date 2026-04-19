/**
 * Transactions controller
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
export declare class TransactionsController {
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    exportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const transactionsController: TransactionsController;
//# sourceMappingURL=transactions.controller.d.ts.map