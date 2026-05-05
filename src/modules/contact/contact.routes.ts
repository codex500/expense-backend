import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { emailService } from '../../services/emailService';
import { getBaseTemplate } from '../../templates/base';
import { env } from '../../config/env';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long")
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, subject, message } = contactSchema.parse(req.body);

    // 1. Send details to Admin via SMTP
    const adminHtml = getBaseTemplate(
      'New Support/Contact Request',
      `<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">New Contact Message</h2>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Name:</strong> ${name}</p>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Email:</strong> ${email}</p>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Subject:</strong> ${subject}</p>
       <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 15px;">
         <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
       </div>`
    );

    // 2. Build Acknowledgement to User
    const userHtml = getBaseTemplate(
      'Support Request Received',
      `<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">Hi ${name},</h2>
       <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
         Thanks for reaching out to us! We have received your message regarding "<strong>${subject}</strong>".
       </p>
       <p style="margin: 0 0 20px; color: #475569; line-height: 1.6;">
         Our support team will review your inquiry and get back to you as soon as possible.
       </p>
       <p style="margin: 0; color: #475569; font-size: 14px;">Best regards,<br>The Trackify Team</p>`
    );

    // 3. Send both emails non-blocking — response returns immediately
    setImmediate(() => {
      emailService.sendEmail('support@trackifyapp.space', `Support Request: ${subject}`, adminHtml).catch(console.error);
      emailService.sendEmail(email, 'We have received your support request - Trackify', userHtml).catch(console.error);
    });

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
