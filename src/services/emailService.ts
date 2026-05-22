/**
 * Email service — sends transactional emails via Resend.
 */

import { Resend } from 'resend';
import { getBaseTemplate } from '../templates/base';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    console.warn('[Email] No RESEND_API_KEY configured, skipping email to:', to);
    return;
  }

  try {
    await resend.emails.send({
      from: 'Trackify <noreply@trackifyapp.space>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[Email] Send error:', error);
  }
};

export const sendWelcomeEmail = (email: string, name: string): void => {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Welcome to Trackify, ${name}!</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
      We are thrilled to have you. Trackify helps you take control of your finances easily and securely.
    </p>
  `;
  const html = getBaseTemplate('Welcome to Trackify', content, `${env.APP_URL}`, 'Start Tracking');

  setImmediate(() => {
    sendEmail(email, 'Welcome to Trackify', html).catch(console.error);
  });
};

export const sendBudgetWarning = (email: string, name: string, percentUsed: number): void => {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">⚠️ Budget Alert, ${name}</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
      You have reached <strong>${percentUsed}%</strong> of your budget. Please review your expenses to stay on track.
    </p>
  `;
  const html = getBaseTemplate('Budget Warning', content, `${env.APP_URL}budgets`, 'Review Budget');

  setImmediate(() => {
    sendEmail(email, `Warning: Budget limit reached (${percentUsed}%)`, html).catch(console.error);
  });
};

export const sendDailyReminder = (email: string, name: string): void => {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Hi ${name},</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
      Just a friendly reminder to log your expenses for today. Keeping track of daily spending helps you stay within your budget!
    </p>
  `;
  const html = getBaseTemplate('Daily Tracking Reminder', content, `${env.APP_URL}`, 'Log Expenses');

  setImmediate(() => {
    sendEmail(email, "Don't forget to track today's expenses", html).catch(console.error);
  });
};

export const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendBudgetWarning,
  sendDailyReminder,
};
