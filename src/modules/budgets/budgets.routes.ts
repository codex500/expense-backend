/**
 * Budgets routes
 */

import { Router } from 'express';
import { budgetsController } from './budgets.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createBudgetSchema, updateBudgetSchema, budgetIdParam } from './budgets.validation';

const router = Router();
router.use(authenticate as any);

router.post('/', validate({ body: createBudgetSchema }), (req, res, next) => budgetsController.create(req as any, res, next));
router.get('/current', (req, res, next) => budgetsController.getCurrent(req as any, res, next));
router.put('/:id', validate({ params: budgetIdParam, body: updateBudgetSchema }), (req, res, next) => budgetsController.update(req as any, res, next));
router.delete('/:id', validate({ params: budgetIdParam }), (req, res, next) => budgetsController.delete(req as any, res, next));

export default router;
