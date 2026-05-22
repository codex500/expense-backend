import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
router.use(authenticate as any);

router.get('/', (req, res, next) => dashboardController.getSummary(req, res, next));

export default router;
