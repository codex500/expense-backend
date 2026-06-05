import { Router } from 'express';
import { contactController } from './contact.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();

router.post('/', (req, res, next) => contactController.submitContact(req, res, next));
router.post('/feedback', authenticate as any, (req, res, next) => contactController.submitFeedback(req, res, next));

export default router;