/**
 * Email service — SMTP-based email system with throttling and templating.
 */

import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { query } from '../../config/database';
import { getBaseTemplate } from '../../templates/base';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: {
                user: env.SMTP_EMAIL,
                pass: env.SMTP_PASSWORD,
            },
        });
    }

    /**
     * Checks if sending this email violates rate limits.
     */
    async canSendEmail(userId: string, emailType: string): Promise<boolean> {
        // Check daily limit
        const { rows: dailyRows } = await query(
            `SELECT COUNT(*) as cnt FROM email_logs 
             WHERE user_id = $1 AND sent_at >= CURRENT_DATE`,
             [userId]
        );
        if (Number(dailyRows[0].cnt) >= env.MAX_EMAILS_PER_USER_PER_DAY) {
            return false;
        }

        // Check cooldown for same type
        const { rows: cooldownRows } = await query(
            `SELECT sent_at FROM email_logs 
             WHERE user_id = $1 AND email_type = $2
             ORDER BY sent_at DESC LIMIT 1`,
             [userId, emailType]
        );

        if (cooldownRows.length > 0) {
            const hoursSinceLast = (new Date().getTime() - new Date(cooldownRows[0].sent_at).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast < env.EMAIL_COOLDOWN_HOURS) {
                return false;
            }
        }

        return true;
    }

    async logEmail(userId: string, emailType: string) {
        await query(
            `INSERT INTO email_logs (user_id, email_type) VALUES ($1, $2)`,
            [userId, emailType]
        );
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!env.SMTP_HOST || !env.SMTP_PASSWORD) {
            console.warn('[EmailService] SMTP not configured. Skipping email to', to);
            return false;
        }

        try {
            await this.transporter.sendMail({
                from: env.MAIL_FROM,
                to,
                subject,
                html,
            });
            return true;
        } catch (error) {
            console.error('[EmailService] Send error:', error);
            return false;
        }
    }

    async sendWelcomeEmail(userId: string, email: string, name: string) {
        const canSend = await this.canSendEmail(userId, 'welcome');
        if (!canSend) return false;

        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Welcome to Trackify, ${name}!</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                We are thrilled to have you. Trackify helps you take control of your finances easily and securely.
            </p>
        `;
        const html = getBaseTemplate('Welcome to Trackify', content, `${env.APP_URL}`, 'Start Tracking');
        
        await this.sendEmail(email, 'Welcome to Trackify', html);
        await this.logEmail(userId, 'welcome');
        return true;
    }

    async sendDailyReminder(userId: string, email: string, name: string) {
        const canSend = await this.canSendEmail(userId, 'daily_reminder');
        if (!canSend) return false;

        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Hi ${name},</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder to log your expenses for today. Keeping track of daily spending helps you stay within your budget!
            </p>
        `;
        const html = getBaseTemplate('Daily Tracking Reminder', content, `${env.APP_URL}`, 'Log Expenses');
        
        await this.sendEmail(email, "Don't forget to track today's expenses", html);
        await this.logEmail(userId, 'daily_reminder');
        return true;
    }
    
    async sendBudgetWarning(userId: string, email: string, name: string, percentUsed: number) {
        const canSend = await this.canSendEmail(userId, 'budget_warning');
        if (!canSend) return false;

        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">⚠️ Budget Alert, ${name}</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                You have reached <strong>${percentUsed}%</strong> of your budget. Please review your expenses to stay on track.
            </p>
        `;
        const html = getBaseTemplate('Budget Warning', content, `${env.APP_URL}/budgets`, 'Review Budget');
        
        await this.sendEmail(email, `Warning: You are close to your budget limit (${percentUsed}%)`, html);
        await this.logEmail(userId, 'budget_warning');
        return true;
    }
}

export const emailService = new EmailService();
