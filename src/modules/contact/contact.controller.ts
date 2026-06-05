import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { contactService } from './contact.service';

export class ContactController {
  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, subject, message } = req.body;
      console.log(`Contact message received from ${name} (${email}): ${subject}`);
      sendSuccess(res, { message: 'Your message has been sent successfully.' }, 'Message sent');
    } catch (err) { next(err); }
  }

  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || null;
      const { rating, category, message, deviceInfo } = req.body;
      
      await contactService.saveFeedback(userId, rating, category, message, deviceInfo);
      
      sendSuccess(res, { message: 'Thank you for your feedback!' }, 'Feedback received');
    } catch (err) { next(err); }
  }
}

export const contactController = new ContactController();