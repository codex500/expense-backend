/**
 * Users routes
 */

import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { updateProfileSchema, changePasswordSchema, updatePreferencesSchema } from './users.validation';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

router.get('/me', (req, res, next) => usersController.getProfile(req as any, res, next));
router.patch('/update', validate({ body: updateProfileSchema }), (req, res, next) => usersController.updateProfile(req as any, res, next));
router.delete('/delete', (req, res, next) => usersController.deleteAccount(req as any, res, next));

export default router;
