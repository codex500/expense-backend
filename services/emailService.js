/**
 * Email Service - Beautiful HTML email templates and sending logic
 * Uses Resend API
 */

const { Resend } = require('resend');
const pool = require('../config/database');

const apiKey = process.env.RESEND_API_KEY || '';
const resend = apiKey ? new Resend(apiKey) : null;
const fromAddress = process.env.MAIL_FROM || 'Trackify <onboarding@resend.dev>';
const appUrl = process.env.APP_URL || 'https://trackifyapp.space';

/**
 * Generate beautiful HTML email template for daily reminder
 */
function generateReminderEmail(userName) {
  const name = userName || 'there';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trackify Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Trackify</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Expense Tracker</p>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 600;">Hi ${name}! 👋</h2>
              
              <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Don't forget to record today's expenses! 📝
              </p>
              
              <p style="margin: 0 0 30px; color: #64748b; font-size: 15px; line-height: 1.6;">
                Tracking your spending daily helps you stay on top of your budget and make smarter financial decisions. Every entry counts toward your financial goals! 💰
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${appUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                      Open Trackify →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
                  <strong>💡 Tip:</strong> Set a daily reminder to log expenses right after dinner. Small habits lead to big savings!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                © ${new Date().getFullYear()} Trackify. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="${appUrl}/unsubscribe" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a> | 
                <a href="${appUrl}/settings" style="color: #94a3b8; text-decoration: underline;">Email Preferences</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Check if user already received email today
 */
async function hasReceivedEmailToday(userId) {
  const result = await pool.query(
    'SELECT 1 FROM email_logs WHERE user_id = $1 AND sent_date = CURRENT_DATE LIMIT 1',
    [userId]
  );
  return result.rows.length > 0;
}

/**
 * Log email sent for today
 */
async function logEmailSent(userId) {
  await pool.query(
    `INSERT INTO email_logs (user_id, sent_date)
     VALUES ($1, CURRENT_DATE)
     ON CONFLICT (user_id, sent_date) DO NOTHING`,
    [userId]
  );
}

/**
 * Send reminder email to user
 */
async function sendReminderEmail(userId, userEmail, userName) {
  if (!resend) {
    console.warn('[EmailService] RESEND_API_KEY not set. Skipping email.');
    return false;
  }

  try {
    const html = generateReminderEmail(userName);
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [userEmail],
      subject: "Don't forget today's expenses 💸",
      html,
    });

    if (error) {
      console.error(`[EmailService] Send failed for ${userEmail}:`, error.message);
      return false;
    }

    await logEmailSent(userId);
    console.log(`[EmailService] Reminder sent to ${userEmail} (id: ${data?.id || 'ok'})`);
    return true;
  } catch (err) {
    console.error(`[EmailService] Send failed for ${userEmail}:`, err.message);
    return false;
  }
}

/**
 * Send budget alert email
 */
async function sendBudgetAlertEmail(userEmail, userName, monthlyExpense, budgetLimit) {
  if (!resend) return false;

  const percentUsed = budgetLimit > 0 ? Math.round((monthlyExpense / budgetLimit) * 100) : 0;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚠️ Budget Alert</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Hi ${userName || 'there'}!</h2>
              <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Your monthly spending has reached <strong>${percentUsed}%</strong> of your budget limit.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 15px;">
                  <strong>Spent:</strong> ₹${Number(monthlyExpense).toLocaleString()}<br>
                  <strong>Budget:</strong> ₹${Number(budgetLimit).toLocaleString()}
                </p>
              </div>
              <p style="margin: 20px 0; color: #64748b; font-size: 15px;">
                Consider reviewing your expenses to stay within budget. Small adjustments can make a big difference!
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0 0;">
                    <a href="${appUrl}" style="display: inline-block; padding: 14px 28px; background: #6366F1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">View Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [userEmail],
      subject: `⚠️ Budget Alert: ${percentUsed}% Used`,
      html,
    });

    if (error) {
      console.error(`[EmailService] Budget alert failed for ${userEmail}:`, error.message);
      return false;
    }

    console.log(`[EmailService] Budget alert sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error(`[EmailService] Budget alert error:`, err.message);
    return false;
  }
}

module.exports = {
  sendReminderEmail,
  sendBudgetAlertEmail,
  hasReceivedEmailToday,
  logEmailSent,
};
