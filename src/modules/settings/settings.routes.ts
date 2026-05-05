import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { updateSettingsSchema } from './settings.validation';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => settingsController.getSettings(req as any, res, next));
router.patch('/', validate({ body: updateSettingsSchema }), (req, res, next) => settingsController.updateSettings(req as any, res, next));

export default router;
