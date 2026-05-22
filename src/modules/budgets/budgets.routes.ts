import { Router } from 'express';
import { budgetsController } from './budgets.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createBudgetSchema } from './budgets.validation';
import { idParamSchema } from '../accounts/accounts.validation';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => budgetsController.list(req, res, next));
router.post('/', validate({ body: createBudgetSchema }), (req, res, next) => budgetsController.upsert(req, res, next));
router.delete('/:id', validate({ params: idParamSchema }), (req, res, next) => budgetsController.delete(req, res, next));

export default router;
