/**
 * Transactions routes
 */

import { Router } from 'express';
import { transactionsController } from './transactions.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionIdParam,
} from './transactions.validation';

const router = Router();
router.use(authenticate as any);

router.post('/', validate({ body: createTransactionSchema }), (req, res, next) => transactionsController.create(req as any, res, next));
router.get('/', validate({ query: transactionQuerySchema }), (req, res, next) => transactionsController.list(req as any, res, next));
router.get('/:id', validate({ params: transactionIdParam }), (req, res, next) => transactionsController.getById(req as any, res, next));
router.put('/:id', validate({ params: transactionIdParam, body: updateTransactionSchema }), (req, res, next) => transactionsController.update(req as any, res, next));
router.delete('/:id', validate({ params: transactionIdParam }), (req, res, next) => transactionsController.delete(req as any, res, next));

export default router;
