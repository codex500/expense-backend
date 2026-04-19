/**
 * Email service — SMTP-based email system with throttling and templating.
 */
export declare class EmailService {
    private transporter;
    constructor();
    /**
     * Checks if sending this email violates rate limits.
     */
    canSendEmail(userId: string, emailType: string): Promise<boolean>;
    logEmail(userId: string, emailType: string): Promise<void>;
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
    sendWelcomeEmail(userId: string, email: string, name: string): Promise<boolean>;
    sendDailyReminder(userId: string, email: string, name: string): Promise<boolean>;
    sendBudgetWarning(userId: string, email: string, name: string, percentUsed: number): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emails.service.d.ts.map