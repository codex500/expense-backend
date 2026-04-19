/**
 * Cron jobs — automated system tasks using node-cron.
 */

import cron from 'node-cron';
import { query } from '../config/database';
import { emailService } from '../modules/emails/emails.service';
import { notificationsService } from '../modules/notifications/notifications.module';
import { budgetsService } from '../modules/budgets/budgets.service';

export function setupCronJobs() {
    
    // 1. Morning Reminder (8:00 AM Daily)
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running Morning Reminder Job...');
        try {
            const { rows: users } = await query(
                `SELECT id, email, full_name FROM user_profiles WHERE notify_email = true`
            );
            for (const user of users) {
                await emailService.sendDailyReminder(user.id, user.email, user.full_name);
                await notificationsService.create(
                    user.id, 'general', 'Morning Reminder', "Don't forget to track your expenses today!"
                );
            }
        } catch (error) {
            console.error('[Cron] Morning Reminder Error:', error);
        }
    }, { timezone: "Asia/Kolkata" });

    // 2. Evening Summary (8:00 PM Daily)
    cron.schedule('0 20 * * *', async () => {
         // Logic for evening summary
         console.log('[Cron] Running Evening Summary Job...');
    }, { timezone: "Asia/Kolkata" });

    // 3. Budget Check (Every 4 hours)
    cron.schedule('0 */4 * * *', async () => {
        console.log('[Cron] Running Budget Check Job...');
        try {
            const { rows: users } = await query(`SELECT id, email, full_name FROM user_profiles`);
            for (const user of users) {
                const alerts = await budgetsService.checkBudgetAlerts(user.id);
                for (const alert of alerts) {
                     await emailService.sendBudgetWarning(user.id, user.email, user.full_name, alert.budget.percentUsed);
                     await notificationsService.create(
                        user.id, 'budget_warning', 'Budget Alert', 
                        `You have used ${alert.budget.percentUsed}% of your ${alert.budget.scope} budget.`
                    );
                }
            }
        } catch (error) {
             console.error('[Cron] Budget Check Error:', error);
        }
    }, { timezone: "Asia/Kolkata" });

    // 4. Monthly Report (1st day of month at 9:00 AM)
    cron.schedule('0 9 1 * *', async () => {
         console.log('[Cron] Running Monthly Report Job...');
         // Logic for monthly reports
    }, { timezone: "Asia/Kolkata" });

    // 5. Salary Reminder (1st day of month at 10:00 AM)
    cron.schedule('0 10 1 * *', async () => {
        console.log('[Cron] Running Salary Reminder Job...');
         // Logic for salary reminder
    }, { timezone: "Asia/Kolkata" });

    console.log('[Cron] All jobs scheduled successfully.');
}
