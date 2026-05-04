import nodemailer from 'nodemailer';
import dns from 'dns';

// Fix Render/Container networking by preferring IPv4 for DNS resolution
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

import { env } from '../../config/env';
import { query } from '../../config/database';
import { getBaseTemplate } from '../../templates/base';
import { initEmailQueue, addToQueue } from './emailQueue';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: 587, // Standard for STARTTLS (favored over 465 for Render/Cloud connectivity)
            secure: false, // Avoid direct SSL/TLS; use STARTTLS instead
            family: 4, // IMPORTANT → force IPv4
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            auth: {
                user: env.SMTP_EMAIL,
                pass: env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        } as any);

        // Initialize the throttling queue
        initEmailQueue(this.transporter);

        this.transporter.verify()
            .then(() => console.log('SMTP Ready'))
            .catch(err => console.error('SMTP Error:', err.message));
    }

    /**
     * Checks if sending this email violates rate limits.
     */
    async canSendEmail(userId: string, emailType: string): Promise<boolean> {
        try {
            // 1. Check overall daily limit per user
            const { rows: dailyRows } = await query(
                `SELECT COUNT(*) as cnt FROM email_logs 
                 WHERE user_id = $1 AND sent_at >= CURRENT_DATE`,
                 [userId]
            );
            if (Number(dailyRows[0].cnt) >= env.MAX_EMAILS_PER_USER_PER_DAY) {
                console.log(`[EmailService] 🚫 Daily limit reached for user ${userId}`);
                return false;
            }

            // 2. Check if same type already sent today (Duplicate Email Prevention)
            // Skip this check for 'otp' as users might need multiple attempts
            if (emailType !== 'otp') {
                const { rows: typeRows } = await query(
                    `SELECT COUNT(*) as cnt FROM email_logs 
                     WHERE user_id = $1 AND email_type = $2 AND sent_at >= CURRENT_DATE`,
                     [userId, emailType]
                );
                if (Number(typeRows[0].cnt) > 0) {
                    console.log(`[EmailService] ⏭️ Skipping duplicate ${emailType} email for user ${userId} today`);
                    return false;
                }
            }

            // 3. Check cooldown for same type
            const { rows: cooldownRows } = await query(
                `SELECT sent_at FROM email_logs 
                 WHERE user_id = $1 AND email_type = $2
                 ORDER BY sent_at DESC LIMIT 1`,
                 [userId, emailType]
            );

            if (cooldownRows.length > 0) {
                const hoursSinceLast = (new Date().getTime() - new Date(cooldownRows[0].sent_at).getTime()) / (1000 * 60 * 60);
                if (hoursSinceLast < env.EMAIL_COOLDOWN_HOURS && emailType !== 'otp') {
                    return false;
                }
            }

            return true;
        } catch (error: any) {
            console.warn('[EmailService] canSendEmail check failed:', error.message);
            return true; // Allow sending if we can't check
        }
    }

    async logEmail(userId: string, emailType: string) {
        try {
            await query(
                `INSERT INTO email_logs (user_id, email_type) VALUES ($1, $2)`,
                [userId, emailType]
            );
        } catch (error: any) {
            console.warn('[EmailService] logEmail failed:', error.message);
        }
    }

    async sendEmail(to: string, subject: string, html: string, userId?: string, emailType?: string) {
        if (!env.SMTP_HOST || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
            console.warn('[EmailService] SMTP not fully configured.');
            return false;
        }

        // If context is provided, enforce throttling and duplicate checks
        if (userId && emailType) {
            const canSend = await this.canSendEmail(userId, emailType);
            if (!canSend) return false;
            await this.logEmail(userId, emailType);
        }

        // Add to the throttling queue
        addToQueue({
            from: env.MAIL_FROM,
            to,
            subject,
            html,
        });

        console.log(`[EmailService] 📥 Email queued for ${to}: ${subject} ${emailType ? `(${emailType})` : ''}`);
        return true;
    }

    async sendWelcomeEmail(userId: string, email: string, name: string) {
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Welcome to Trackify, ${name}!</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                We are thrilled to have you. Trackify helps you take control of your finances easily and securely.
            </p>
        `;
        const html = getBaseTemplate('Welcome to Trackify', content, `${env.APP_URL}`, 'Start Tracking');

        setImmediate(() => {
            this.sendEmail(email, 'Welcome to Trackify', html, userId, 'welcome').catch(console.error);
        });
        return true;
    }

    async sendDailyReminder(userId: string, email: string, name: string) {
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Hi ${name},</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder to log your expenses for today. Keeping track of daily spending helps you stay within your budget!
            </p>
        `;
        const html = getBaseTemplate('Daily Tracking Reminder', content, `${env.APP_URL}`, 'Log Expenses');

        setImmediate(() => {
            this.sendEmail(email, "Don't forget to track today's expenses", html, userId, 'daily_reminder').catch(console.error);
        });
        return true;
    }
    
    async sendBudgetWarning(userId: string, email: string, name: string, percentUsed: number) {
        const content = `
            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">⚠️ Budget Alert, ${name}</h2>
            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                You have reached <strong>${percentUsed}%</strong> of your budget. Please review your expenses to stay on track.
            </p>
        `;
        const html = getBaseTemplate('Budget Warning', content, `${env.APP_URL}/budgets`, 'Review Budget');

        setImmediate(() => {
            this.sendEmail(email, `Warning: You are close to your budget limit (${percentUsed}%)`, html, userId, 'budget_warning').catch(console.error);
        });
        return true;
    }
}

export const emailService = new EmailService();
