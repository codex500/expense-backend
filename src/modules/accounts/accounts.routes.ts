import { Router } from 'express';
import { accountsController } from './accounts.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createAccountSchema, updateAccountSchema, idParamSchema } from './accounts.validation';

const router = Router();

router.use(authenticate as any);

router.get('/', (req, res, next) => accountsController.list(req, res, next));
router.get('/:id', validate({ params: idParamSchema }), (req, res, next) => accountsController.getById(req, res, next));
router.post('/', validate({ body: createAccountSchema }), (req, res, next) => accountsController.create(req, res, next));
router.put('/:id', validate({ params: idParamSchema, body: updateAccountSchema }), (req, res, next) => accountsController.update(req, res, next));
router.delete('/:id', validate({ params: idParamSchema }), (req, res, next) => accountsController.delete(req, res, next));

export default router;
