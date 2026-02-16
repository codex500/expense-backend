/**
 * Daily Reminder Job - Runs at 9:00 PM server time
 * Sends ONE email per user per day (optimized for Resend free tier)
 */

const cron = require('node-cron');
const pool = require('../config/database');
const { sendReminderEmail, hasReceivedEmailToday } = require('../services/emailService');
const { checkBudgetAlerts } = require('../services/budgetAlertService');

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

/**
 * Delay helper for throttling emails
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run daily reminder job
 * Sends emails to all users who haven't received one today
 */
async function runDailyReminder() {
  if (!EMAIL_ENABLED) {
    console.log('[Cron] EMAIL_ENABLED is false - daily reminder disabled');
    return;
  }

  try {
    console.log('[Cron] Starting daily reminder job at', new Date().toISOString());
    
    // Fetch all users
    const usersResult = await pool.query(
      'SELECT id, email, name FROM users ORDER BY created_at'
    );
    const users = usersResult.rows;

    if (users.length === 0) {
      console.log('[Cron] No users found');
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each user with 500ms delay
    for (const user of users) {
      try {
        // Check if already sent today
        const alreadySent = await hasReceivedEmailToday(user.id);
        
        if (alreadySent) {
          skippedCount++;
          continue;
        }

        // Send email
        const sent = await sendReminderEmail(user.id, user.email, user.name);
        
        if (sent) {
          sentCount++;
        } else {
          errorCount++;
        }

        // Throttle: 500ms delay between emails
        await delay(500);
      } catch (err) {
        console.error(`[Cron] Error processing user ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log(`[Cron] Daily reminder completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
    
    // Also check budget alerts
    await checkBudgetAlerts();
  } catch (err) {
    console.error('[Cron] Daily reminder job error:', err.message);
  }
}

/**
 * Start the daily reminder cron job
 */
function startDailyReminderJob() {
  if (!EMAIL_ENABLED) {
    console.log('[Cron] EMAIL_ENABLED is false - reminder job disabled');
    return;
  }

  // Run daily at 21:00 (9 PM) server time
  cron.schedule('0 21 * * *', () => {
    runDailyReminder().catch((err) => console.error('[Cron] Daily reminder error:', err));
  });
  
  console.log('[Cron] Daily reminder job scheduled (every day at 21:00 / 9 PM)');
}

module.exports = { startDailyReminderJob, runDailyReminder };
