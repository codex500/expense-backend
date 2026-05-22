import { Router } from 'express';
import { transactionsController } from './transactions.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from './transactions.validation';
import { idParamSchema } from '../accounts/accounts.validation';

const router = Router();
router.use(authenticate as any);

router.get('/', validate({ query: transactionQuerySchema }), (req, res, next) => transactionsController.list(req, res, next));
router.get('/:id', validate({ params: idParamSchema }), (req, res, next) => transactionsController.getById(req, res, next));
router.post('/', validate({ body: createTransactionSchema }), (req, res, next) => transactionsController.create(req, res, next));
router.put('/:id', validate({ params: idParamSchema, body: updateTransactionSchema }), (req, res, next) => transactionsController.update(req, res, next));
router.delete('/:id', validate({ params: idParamSchema }), (req, res, next) => transactionsController.delete(req, res, next));

export default router;
