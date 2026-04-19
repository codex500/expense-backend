"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const emails_service_1 = require("../emails/emails.service");
const base_1 = require("../../templates/base");
const env_1 = require("../../config/env");
const router = (0, express_1.Router)();
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    subject: zod_1.z.string().min(1, "Subject is required"),
    message: zod_1.z.string().min(10, "Message must be at least 10 characters long")
});
router.post('/', async (req, res, next) => {
    try {
        const { name, email, subject, message } = contactSchema.parse(req.body);
        // 1. Send details to Admin via SMTP
        const adminHtml = (0, base_1.getBaseTemplate)('New Support/Contact Request', `<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">New Contact Message</h2>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Name:</strong> ${name}</p>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Email:</strong> ${email}</p>
       <p style="margin: 0 0 10px; color: #475569;"><strong>Subject:</strong> ${subject}</p>
       <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 15px;">
         <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
       </div>`);
        // Send to admin email (the actual inbox, not the noreply sender)
        await emails_service_1.emailService.sendEmail(env_1.env.SMTP_EMAIL, `Support Request: ${subject}`, adminHtml);
        // 2. Send Acknowledgement to User
        const userHtml = (0, base_1.getBaseTemplate)('Support Request Received', `<h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">Hi ${name},</h2>
       <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
         Thanks for reaching out to us! We have received your message regarding "<strong>${subject}</strong>".
       </p>
       <p style="margin: 0 0 20px; color: #475569; line-height: 1.6;">
         Our support team will review your inquiry and get back to you as soon as possible.
       </p>
       <p style="margin: 0; color: #475569; font-size: 14px;">Best regards,<br>The Trackify Team</p>`);
        await emails_service_1.emailService.sendEmail(email, 'We have received your support request - Trackify', userHtml);
        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=contact.routes.js.map