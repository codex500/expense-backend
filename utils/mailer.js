/**
 * Resend Email API utility
 * Uses RESEND_API_KEY - no SMTP ports, works on Render.
 * Sends HTML emails via HTTPS.
 */

const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY || '';
const resend = apiKey ? new Resend(apiKey) : null;
const fromAddress = process.env.MAIL_FROM || 'Trackify <no-reply@trackifyapp.space>';

/**
 * Escape text for safe HTML
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert plain text to HTML
 */
function textToHtml(text) {
  const escaped = escapeHtml(text);
  return `<p style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">${escaped.replace(/\n/g, '</p><p style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">')}</p>`;
}

/**
 * Send an email via Resend API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body (converted to HTML)
 * @param {string} [html] - Optional HTML body (overrides text if provided)
 * @returns {Promise<boolean>} - true if sent, false otherwise (never throws)
 */
async function sendEmail(to, subject, text, html) {
  if (!resend) {
    console.warn('[Mailer] RESEND_API_KEY not set. Skipping email.');
    return false;
  }

  const body = html || textToHtml(text);

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html: body,
    });

    if (error) {
      console.error('[Mailer] Send failed:', error.message);
      return false;
    }

    console.log('[Mailer] Email sent to', to, 'id:', data?.id || 'ok');
    return true;
  } catch (err) {
    console.error('[Mailer] Send failed:', err.message);
    return false;
  }
}

module.exports = { sendEmail };
