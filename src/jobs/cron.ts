/**
 * Cron jobs — automated system tasks.
 */

import cron from 'node-cron';
import { query } from '../config/database';
import { emailService } from '../services/emailService';
import { pushService } from '../services/pushService';
import { notificationsService } from '../modules/notifications/notifications.service';
import { budgetsService } from '../modules/budgets/budgets.service';
import { ExpoPushMessage } from 'expo-server-sdk';

export function setupCronJobs(): void {

  // 1. Budget Check (Every 4 hours)
  cron.schedule('0 */4 * * *', async () => {
    try {
      const { rows: users } = await query<any>(
        'SELECT id, email, full_name, notify_budget, push_token FROM user_profiles WHERE notify_budget = true'
      );

      const pushMessages: ExpoPushMessage[] = [];

      for (const user of users) {
        try {
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

  // 2. Morning Reminder (8:00 AM Daily)
  cron.schedule('0 8 * * *', async () => {
    try {
      const { rows: users } = await query<any>(
        'SELECT id, email, full_name, push_token FROM user_profiles WHERE notify_email = true OR notify_push = true'
      );

      const pushMessages: ExpoPushMessage[] = [];

      for (const user of users) {
        emailService.sendDailyReminder(user.email, user.full_name);
        await notificationsService.create(
          user.id,
          'general',
          'Morning Reminder',
          "Don't forget to track your expenses today!"
        );

        if (user.push_token) {
          pushMessages.push({
            to: user.push_token,
            sound: 'default',
            title: 'Good Morning! ☀️',
            body: "Don't forget to track your expenses today!",
          });
        }
      }

      if (pushMessages.length > 0) {
        await pushService.sendPushNotifications(pushMessages);
      }
    } catch (error) {
      console.error('[Cron] Morning Reminder Error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 3. Cleanup old notifications (weekly, Sunday 3 AM)
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
