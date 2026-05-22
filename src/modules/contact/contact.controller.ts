import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response';

export class ContactController {
  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, subject, message } = req.body;
      
      // Here you would normally send an email or store the message in the database.
      // For now, we will just return a success response to satisfy the frontend.
      
      console.log(`Contact message received from ${name} (${email}): ${subject}`);

      sendSuccess(res, { message: 'Your message has been sent successfully.' }, 'Message sent');
    } catch (err) { next(err); }
  }
}

export const contactController = new ContactController();