/**
 * Trackify - Scheduled reminder email jobs
 * Uses node-cron to run hourly and evening reminders.
 * Prevents duplicate emails to same user within the same hour.
 */

const cron = require('node-cron');
const pool = require('../config/database');
const { sendEmail } = require('../utils/mailer');

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

// Prevent duplicate emails: userId -> last sent timestamp (ms)
const hourlySent = new Map();
const eveningSent = new Set();

// Clean old entries (older than 1 hour)
function pruneHourlySent() {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [userId, ts] of hourlySent.entries()) {
    if (ts < cutoff) hourlySent.delete(userId);
  }
}

// Clear evening set at midnight (new day)
let lastEveningDate = null;
function resetEveningIfNewDay() {
  const today = new Date().toDateString();
  if (lastEveningDate !== today) {
    eveningSent.clear();
    lastEveningDate = today;
  }
}

/**
 * Get users who have NOT added any transaction in the last 24 hours
 */
async function getUsersWithoutTransactionLast24h() {
  const result = await pool.query(
    `SELECT u.id, u.email
     FROM users u
     WHERE NOT EXISTS (
       SELECT 1 FROM transactions t
       WHERE t.user_id = u.id
       AND t.transaction_date >= (NOW() - INTERVAL '24 HOURS')::date
     )`
  );
  return result.rows;
}

/**
 * Get users who have NOT added any transaction today
 */
async function getUsersWithoutTransactionToday() {
  const result = await pool.query(
    `SELECT u.id, u.email
     FROM users u
     WHERE NOT EXISTS (
       SELECT 1 FROM transactions t
       WHERE t.user_id = u.id
       AND t.transaction_date = CURRENT_DATE
     )`
  );
  return result.rows;
}

/**
 * Hourly reminder: users with no transaction in last 24h
 */
async function runHourlyReminder() {
  if (!EMAIL_ENABLED) return;

  try {
    pruneHourlySent();
    const users = await getUsersWithoutTransactionLast24h();
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    for (const user of users) {
      const lastSent = hourlySent.get(user.id);
      if (lastSent && now - lastSent < hourMs) continue; // Skip if sent in last hour

      try {
        const sent = await sendEmail(
          user.email,
          'Trackify Reminder ⏰',
          "You haven't logged any expenses recently. Recording expenses daily helps you control spending."
        );
        if (sent) {
          hourlySent.set(user.id, now);
          console.log(`[Cron] Hourly reminder sent to ${user.email}`);
        }
      } catch (err) {
        console.error(`[Cron] Hourly email failed for ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Hourly reminder job error:', err.message);
  }
}

/**
 * Evening reminder: one batch of emails (up to 10 users) - no transaction today
 * Called every 6 minutes between 20:00–21:00
 */
async function runEveningReminder() {
  if (!EMAIL_ENABLED) return;

  try {
    resetEveningIfNewDay();
    const users = await getUsersWithoutTransactionToday();
    const toSend = users.filter((u) => !eveningSent.has(u.id)).slice(0, 10);

    for (const user of toSend) {
      try {
        const sent = await sendEmail(
          user.email,
          "Don't forget today's expenses 💸",
          "Before your day ends, quickly add today's spending in Trackify."
        );
        if (sent) {
          eveningSent.add(user.id);
          console.log(`[Cron] Evening reminder sent to ${user.email}`);
        }
      } catch (err) {
        console.error(`[Cron] Evening email failed for ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Evening reminder job error:', err.message);
  }
}

/**
 * Start all cron jobs (non-blocking)
 */
function startReminderJobs() {
  if (!EMAIL_ENABLED) {
    console.log('[Cron] EMAIL_ENABLED is false - reminder jobs disabled');
    return;
  }

  // Hourly: at minute 0 of every hour
  cron.schedule('0 * * * *', () => {
    runHourlyReminder().catch((err) => console.error('[Cron] Hourly job:', err));
  });
  console.log('[Cron] Hourly reminder job scheduled (every hour at :00)');

  // Evening: every 6 minutes between 20:00 and 21:00 (10 runs: 20:00, 20:06, ..., 20:54)
  cron.schedule('0,6,12,18,24,30,36,42,48,54 20 * * *', () => {
    runEveningReminder().catch((err) => console.error('[Cron] Evening job:', err));
  });
  console.log('[Cron] Evening reminder job scheduled (every 6 min between 20:00-21:00)');
}

module.exports = { startReminderJobs, runHourlyReminder, runEveningReminder };
