import { Router } from 'express';
import { contactController } from './contact.controller';

const router = Router();

router.post('/', (req, res, next) => contactController.submitContact(req, res, next));

export default router;