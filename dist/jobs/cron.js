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
const emails_service_1 = require("../modules/emails/emails.service");
const notifications_module_1 = require("../modules/notifications/notifications.module");
const budgets_service_1 = require("../modules/budgets/budgets.service");
function setupCronJobs() {
    // 1. Morning Reminder (8:00 AM Daily)
    node_cron_1.default.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running Morning Reminder Job...');
        try {
            const { rows: users } = await (0, database_1.query)(`SELECT id, email, full_name FROM user_profiles WHERE notify_email = true`);
            for (const user of users) {
                await emails_service_1.emailService.sendDailyReminder(user.id, user.email, user.full_name);
                await notifications_module_1.notificationsService.create(user.id, 'general', 'Morning Reminder', "Don't forget to track your expenses today!");
            }
        }
        catch (error) {
            console.error('[Cron] Morning Reminder Error:', error);
        }
    });
    // 2. Evening Summary (8:00 PM Daily)
    node_cron_1.default.schedule('0 20 * * *', async () => {
        // Logic for evening summary
        console.log('[Cron] Running Evening Summary Job...');
    });
    // 3. Budget Check (Every 4 hours)
    node_cron_1.default.schedule('0 */4 * * *', async () => {
        console.log('[Cron] Running Budget Check Job...');
        try {
            const { rows: users } = await (0, database_1.query)(`SELECT id, email, full_name FROM user_profiles`);
            for (const user of users) {
                const alerts = await budgets_service_1.budgetsService.checkBudgetAlerts(user.id);
                for (const alert of alerts) {
                    await emails_service_1.emailService.sendBudgetWarning(user.id, user.email, user.full_name, alert.budget.percentUsed);
                    await notifications_module_1.notificationsService.create(user.id, 'budget_warning', 'Budget Alert', `You have used ${alert.budget.percentUsed}% of your ${alert.budget.scope} budget.`);
                }
            }
        }
        catch (error) {
            console.error('[Cron] Budget Check Error:', error);
        }
    });
    // 4. Monthly Report (1st day of month at 9:00 AM)
    node_cron_1.default.schedule('0 9 1 * *', async () => {
        console.log('[Cron] Running Monthly Report Job...');
        // Logic for monthly reports
    });
    // 5. Salary Reminder (1st day of month at 10:00 AM)
    node_cron_1.default.schedule('0 10 1 * *', async () => {
        console.log('[Cron] Running Salary Reminder Job...');
        // Logic for salary reminder
    });
    console.log('[Cron] All jobs scheduled successfully.');
}
//# sourceMappingURL=cron.js.map