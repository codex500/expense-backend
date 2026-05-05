"use strict";
/**
 * Cron jobs — automated system tasks using node-cron.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCronJobs = setupCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const emailService_1 = require("../services/emailService");
const notifications_module_1 = require("../modules/notifications/notifications.module");
const budgets_service_1 = require("../modules/budgets/budgets.service");
function setupCronJobs() {
    // 1. Morning Reminder (8:00 AM Daily)
    node_cron_1.default.schedule('0 8 * * *', async () => {
        try {
            const { rows: users } = await (0, database_1.query)(`SELECT id, email, full_name FROM user_profiles WHERE notify_email = true`);
            for (const user of users) {
                emailService_1.emailService.sendDailyReminder(user.email, user.full_name).catch(console.error);
                await notifications_module_1.notificationsService.create(user.id, 'general', 'Morning Reminder', "Don't forget to track your expenses today!");
            }
        }
        catch (error) {
            console.error('[Cron] Morning Reminder Error:', error);
        }
    }, { timezone: "Asia/Kolkata" });
    // 2. Evening Summary (8:00 PM Daily)
    node_cron_1.default.schedule('0 20 * * *', async () => {
        // Logic for evening summary
    }, { timezone: "Asia/Kolkata" });
    // 3. Budget Check (Every 4 hours)
    node_cron_1.default.schedule('0 */4 * * *', async () => {
        try {
            const { rows: users } = await (0, database_1.query)(`SELECT id, email, full_name FROM user_profiles`);
            for (const user of users) {
                const alerts = await budgets_service_1.budgetsService.checkBudgetAlerts(user.id);
                for (const alert of alerts) {
                    emailService_1.emailService.sendBudgetWarning(user.email, user.full_name, alert.budget.percentUsed).catch(console.error);
                    await notifications_module_1.notificationsService.create(user.id, 'budget_warning', 'Budget Alert', `You have used ${alert.budget.percentUsed}% of your ${alert.budget.scope} budget.`);
                }
            }
        }
        catch (error) {
            console.error('[Cron] Budget Check Error:', error);
        }
    }, { timezone: "Asia/Kolkata" });
    // 4. Monthly Report (1st day of month at 9:00 AM)
    node_cron_1.default.schedule('0 9 1 * *', async () => {
        // Logic for monthly reports
    }, { timezone: "Asia/Kolkata" });
    // 5. Salary Reminder (1st day of month at 10:00 AM)
    node_cron_1.default.schedule('0 10 1 * *', async () => {
        // Logic for salary reminder
    }, { timezone: "Asia/Kolkata" });
    // 6. Keep-alive (Every 5 minutes)
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            const res = await fetch(`${env_1.env.APP_URL}/health`);
        }
        catch (error) {
            console.warn('[Cron] Keep-alive ping failed:', error.message);
        }
    });
    console.info('[Cron] All jobs scheduled successfully.');
}
//# sourceMappingURL=cron.js.map