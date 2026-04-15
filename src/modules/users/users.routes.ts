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

router.get('/profile', (req, res, next) => usersController.getProfile(req as any, res, next));
router.put('/profile', validate({ body: updateProfileSchema }), (req, res, next) => usersController.updateProfile(req as any, res, next));
router.put('/preferences', validate({ body: updatePreferencesSchema }), (req, res, next) => usersController.updatePreferences(req as any, res, next));
router.post('/change-password', validate({ body: changePasswordSchema }), (req, res, next) => usersController.changePassword(req as any, res, next));
router.delete('/account', (req, res, next) => usersController.deleteAccount(req as any, res, next));

export default router;
