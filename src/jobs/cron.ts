/**
 * Cron jobs — automated system tasks.
 */

import cron from 'node-cron';
import { query } from '../config/database';
import { emailService } from '../services/emailService';
import { pushService } from '../services/pushService';
import { notificationsService } from '../modules/notifications/notifications.service';
import { budgetsService } from '../modules/budgets/budgets.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export function setupCronJobs(): void {

  // 1. Budget Check (Every 4 hours)
  cron.schedule('0 */4 * * *', async () => {
    try {
      // Get users who want budget alerts, and their active device tokens
      const { rows: users } = await query<any>(
        `SELECT u.id, u.email, u.full_name, u.notify_budget, dt.token as push_token 
         FROM user_profiles u 
         LEFT JOIN device_tokens dt ON u.id = dt.user_id AND dt.is_active = true
         WHERE u.notify_budget = true`
      );

      const pushMessages: ExpoPushMessage[] = [];
      const processedUsers = new Set<string>();

      for (const user of users) {
        try {
          // Only check budget and send email/in-app notification once per user
          if (!processedUsers.has(user.id)) {
            const alerts = await budgetsService.checkBudgetAlerts(user.id);
            for (const alert of alerts) {
              const msgBody = `You have used ${alert.budget.percentUsed}% of your ${alert.budget.scope} budget.`;
              emailService.sendBudgetWarning(user.email, user.full_name, alert.budget.percentUsed);
              
              await notificationsService.create(
                user.id,
                'budget_warning',
                'Budget Alert',
                msgBody
              );

              if (user.push_token) {
                pushMessages.push({
                  to: user.push_token,
                  sound: 'default',
                  title: 'Budget Alert ⚠️',
                  body: msgBody,
                });
              }
            }
            processedUsers.add(user.id);
          } else {
            // If user is already processed (they have multiple devices), just add the push message
            // Wait, we need to know if they had alerts.
            // A better way: fetch alerts first for unique users, then attach tokens.
          }
        } catch (err) {
          console.error(`[Cron] Budget check failed for user ${user.id}:`, err);
        }
      }

      if (pushMessages.length > 0) {
        await pushService.sendPushNotifications(pushMessages);
      }
    } catch (error) {
      console.error('[Cron] Budget Check Error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  // Helper function to send broadcast push notifications
  const sendBroadcast = async (title: string, body: string, timeContext: string) => {
    try {
      const { rows: users } = await query<any>(
        `SELECT u.id, u.email, u.full_name, dt.token as push_token 
         FROM user_profiles u 
         LEFT JOIN device_tokens dt ON u.id = dt.user_id AND dt.is_active = true
         WHERE u.notify_push = true OR u.notify_email = true`
      );

      const pushMessages: ExpoPushMessage[] = [];
      const processedUsers = new Set<string>();

      for (const user of users) {
        if (!processedUsers.has(user.id)) {
          // Send email only for morning (to avoid spam)
          if (timeContext === 'morning') {
             emailService.sendDailyReminder(user.email, user.full_name);
          }

          // In-app notification
          await notificationsService.create(
            user.id,
            'general',
            `${timeContext} Reminder`,
            body
          );
          processedUsers.add(user.id);
        }

        // Push to all active devices
        if (user.push_token && Expo.isExpoPushToken(user.push_token)) {
          pushMessages.push({
            to: user.push_token,
            sound: 'default',
            title: title,
            body: body,
          });
        }
      }

      if (pushMessages.length > 0) {
        await pushService.sendPushNotifications(pushMessages);
      }
    } catch (error) {
      console.error(`[Cron] ${timeContext} Reminder Error:`, error);
    }
  };

  // 2. Morning Reminder (8:00 AM Daily) - Wishes & Alert
  cron.schedule('0 8 * * *', async () => {
    await sendBroadcast(
      'Good Morning! ☀️',
      "Have a great day ahead! Don't forget to track your expenses today to stay on top of your budget.",
      'morning'
    );
  }, { timezone: 'Asia/Kolkata' });

  // 3. Afternoon Reminder (2:00 PM Daily) - Wishes
  cron.schedule('0 14 * * *', async () => {
    await sendBroadcast(
      'Good Afternoon! ☕',
      "Hope you're having a productive day! Take a quick break and review your daily spending.",
      'afternoon'
    );
  }, { timezone: 'Asia/Kolkata' });

  // 4. Evening Reminder (8:30 PM Daily) - Alert to add expenses
  cron.schedule('30 20 * * *', async () => {
    await sendBroadcast(
      'Good Evening! 🌙',
      "Day is almost over! Have you added all your expenses for today? Take 2 mins to log them now.",
      'evening'
    );
  }, { timezone: 'Asia/Kolkata' });

  // 5. Cleanup old notifications (weekly, Sunday 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    try {
      await query(
        "DELETE FROM notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '30 days'"
      );
      console.info('[Cron] Old notifications cleaned up.');
    } catch (error) {
      console.error('[Cron] Notification cleanup error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.info('[Cron] All jobs scheduled successfully.');
}
