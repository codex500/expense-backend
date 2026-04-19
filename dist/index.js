"use strict";
/**
 * Expense Tracker API - Entry point
 * Production-ready TypeScript Architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const errorHandler_1 = require("./shared/middleware/errorHandler");
const rateLimiter_1 = require("./shared/middleware/rateLimiter");
const database_1 = __importDefault(require("./config/database"));
const cron_1 = require("./jobs/cron");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const accounts_routes_1 = __importDefault(require("./modules/accounts/accounts.routes"));
const transactions_routes_1 = __importDefault(require("./modules/transactions/transactions.routes"));
const budgets_routes_1 = __importDefault(require("./modules/budgets/budgets.routes"));
const salary_module_1 = __importDefault(require("./modules/salary/salary.module"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const advisor_module_1 = __importDefault(require("./modules/advisor/advisor.module"));
const notifications_module_1 = __importDefault(require("./modules/notifications/notifications.module"));
const contact_routes_1 = __importDefault(require("./modules/contact/contact.routes"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowed = env_1.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);
        if (allowed.includes(origin) || origin === env_1.env.APP_URL) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Global Rate Limiter
app.use('/api/', rateLimiter_1.apiLimiter);
// API Routes
const apiRouter = express_1.default.Router();
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/users', users_routes_1.default);
apiRouter.use('/accounts', accounts_routes_1.default);
apiRouter.use('/transactions', transactions_routes_1.default);
apiRouter.use('/budgets', budgets_routes_1.default);
apiRouter.use('/salary', salary_module_1.default);
apiRouter.use('/analytics', analytics_routes_1.default);
apiRouter.use('/advisor', advisor_module_1.default);
apiRouter.use('/notifications', notifications_module_1.default);
apiRouter.use('/contact', contact_routes_1.default);
app.use('/api', apiRouter);
// Health Check
app.get('/health', async (req, res) => {
    try {
        await database_1.default.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});
// Root
app.get('/', (req, res) => {
    res.json({
        message: 'Expense Tracker API v2',
        version: '2.0.0',
        docs: '/api/docs'
    });
});
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Start Server
app.listen(env_1.env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
    // Warm up database connection
    database_1.default.query('SELECT 1')
        .then(() => console.log('✅ Database connected to Supabase Pooler'))
        .catch((err) => console.warn('⚠️ Database connection warning:', err.message));
    // Start Cron Jobs
    (0, cron_1.setupCronJobs)();
});
//# sourceMappingURL=index.js.map