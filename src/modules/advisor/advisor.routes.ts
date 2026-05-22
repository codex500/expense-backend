import { Router } from 'express';
import { advisorController } from './advisor.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
router.use(authenticate as any);

router.get('/insights', (req, res, next) => advisorController.getInsights(req, res, next));

export default router;