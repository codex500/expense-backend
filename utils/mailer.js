/**
 * Nodemailer utility for sending emails
 * Configure via SMTP env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const transporter = createTransport();

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @returns {Promise<boolean>} - true if sent, false if mailer not configured
 */
async function sendEmail(to, subject, text) {
  if (!transporter) {
    console.warn('[Mailer] SMTP not configured (missing SMTP_HOST, SMTP_USER, SMTP_PASS). Skipping email.');
    return false;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@trackify.app';

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('[Mailer] Send failed:', err.message);
    throw err;
  }
}

module.exports = { sendEmail };
