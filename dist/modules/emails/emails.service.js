"use strict";
/**
 * Email service — SMTP-based email system with throttling and templating.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const base_1 = require("../../templates/base");
class EmailService {
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: env_1.env.SMTP_HOST,
            port: env_1.env.SMTP_PORT,
            secure: env_1.env.SMTP_PORT === 465,
            auth: {
                user: env_1.env.SMTP_EMAIL,
                pass: env_1.env.SMTP_PASSWORD,
            },
        });
    }
    /**
     * Checks if sending this email violates rate limits.
     */
    async canSendEmail(userId, emailType) {
        try {
            // Check daily limit
            const { rows: dailyRows } = await (0, database_1.query)(`SELECT COUNT(*) as cnt FROM email_logs 
                 WHERE user_id = $1 AND sent_at >= CURRENT_DATE`, [userId]);
            if (Number(dailyRows[0].cnt) >= env_1.env.MAX_EMAILS_PER_USER_PER_DAY) {
                return false;
            }
            // Check cooldown for same type
            const { rows: cooldownRows } = await (0, database_1.query)(`SELECT sent_at FROM email_logs 
                 WHERE user_id = $1 AND email_type = $2
                 ORDER BY sent_at DESC LIMIT 1`, [userId, emailType]);
            if (cooldownRows.length > 0) {
                const hoursSinceLast = (new Date().getTime() - new Date(cooldownRows[0].sent_at).getTime()) / (1000 * 60 * 60);
                if (hoursSinceLast < env_1.env.EMAIL_COOLDOWN_HOURS) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.warn('[EmailService] canSendEmail check failed (table may not exist):', error.message);
            return true; // Allow sending if we can't check
        }
    }
    async logEmail(userId, emailType) {
        try {
            await (0, database_1.query)(`INSERT INTO email_logs (user_id, email_type) VALUES ($1, $2)`, [userId, emailType]);
        }
        catch (error) {
            console.warn('[EmailService] logEmail failed:', error.message);
        }
    }
    async sendEmail(to, subject, html) {
        if (!env_1.env.SMTP_HOST || !env_1.env.SMTP_PASSWORD || !env_1.env.MAIL_FROM) {
            console.warn('[EmailService] SMTP not fully configured. Missing:', !env_1.env.SMTP_HOST ? 'SMTP_HOST' : '', !env_1.env.SMTP_PASSWORD ? 'SMTP_PASSWORD' : '', !env_1.env.MAIL_FROM ? 'MAIL_FROM' : '');
            return false;
        }
        try {
            await this.transporter.sendMail({
                from: env_1.env.MAIL_FROM,
                to,
                subject,
                html,
            });
            console.log(`[EmailService] ✅ Email sent to ${to}: ${subject}`);
            return true;
        }
        catch (error) {
            console.error('[EmailService] ❌ Send error to', to, ':', error.message || error);
            return false;
        }
    }
    async sendWelcomeEmail(userId, email, name) {
        const canSend = await this.canSendEmail(userId, 'welcome');
        if (!canSend)
            return false;
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Welcome to Trackify, ${name}!</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                We are thrilled to have you. Trackify helps you take control of your finances easily and securely.
            </p>
        `;
        const html = (0, base_1.getBaseTemplate)('Welcome to Trackify', content, `${env_1.env.APP_URL}`, 'Start Tracking');
        await this.sendEmail(email, 'Welcome to Trackify', html);
        await this.logEmail(userId, 'welcome');
        return true;
    }
    async sendDailyReminder(userId, email, name) {
        const canSend = await this.canSendEmail(userId, 'daily_reminder');
        if (!canSend)
            return false;
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Hi ${name},</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder to log your expenses for today. Keeping track of daily spending helps you stay within your budget!
            </p>
        `;
        const html = (0, base_1.getBaseTemplate)('Daily Tracking Reminder', content, `${env_1.env.APP_URL}`, 'Log Expenses');
        await this.sendEmail(email, "Don't forget to track today's expenses", html);
        await this.logEmail(userId, 'daily_reminder');
        return true;
    }
    async sendBudgetWarning(userId, email, name, percentUsed) {
        const canSend = await this.canSendEmail(userId, 'budget_warning');
        if (!canSend)
            return false;
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">⚠️ Budget Alert, ${name}</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                You have reached <strong>${percentUsed}%</strong> of your budget. Please review your expenses to stay on track.
            </p>
        `;
        const html = (0, base_1.getBaseTemplate)('Budget Warning', content, `${env_1.env.APP_URL}/budgets`, 'Review Budget');
        await this.sendEmail(email, `Warning: You are close to your budget limit (${percentUsed}%)`, html);
        await this.logEmail(userId, 'budget_warning');
        return true;
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=emails.service.js.map