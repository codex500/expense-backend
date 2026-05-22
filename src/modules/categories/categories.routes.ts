import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { createCategorySchema, updateCategorySchema } from './categories.validation';
import { idParamSchema } from '../accounts/accounts.validation';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => categoriesController.list(req, res, next));
router.post('/', validate({ body: createCategorySchema }), (req, res, next) => categoriesController.create(req, res, next));
router.put('/:id', validate({ params: idParamSchema, body: updateCategorySchema }), (req, res, next) => categoriesController.update(req, res, next));
router.delete('/:id', validate({ params: idParamSchema }), (req, res, next) => categoriesController.delete(req, res, next));

export default router;
