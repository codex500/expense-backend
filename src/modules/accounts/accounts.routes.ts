/**
 * Accounts routes
 */

import { Router } from 'express';
import { accountsController } from './accounts.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createAccountSchema, updateAccountSchema, transferSchema, accountIdParam } from './accounts.validation';

const router = Router();
router.use(authenticate as any);

router.post('/', validate({ body: createAccountSchema }), (req, res, next) => accountsController.create(req as any, res, next));
router.get('/', (req, res, next) => accountsController.getAll(req as any, res, next));
router.get('/summary', (req, res, next) => accountsController.getSummary(req as any, res, next));
router.get('/:id', validate({ params: accountIdParam }), (req, res, next) => accountsController.getById(req as any, res, next));
router.put('/:id', validate({ params: accountIdParam, body: updateAccountSchema }), (req, res, next) => accountsController.update(req as any, res, next));
router.delete('/:id', validate({ params: accountIdParam }), (req, res, next) => accountsController.delete(req as any, res, next));
router.post('/transfer', validate({ body: transferSchema }), (req, res, next) => accountsController.transfer(req as any, res, next));

export default router;
