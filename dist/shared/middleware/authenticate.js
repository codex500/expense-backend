"use strict";
/**
 * Authentication middleware — validates Supabase JWT tokens.
 * Attaches the authenticated user to req.user.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const supabase_1 = require("../../config/supabase");
const database_1 = require("../../config/database");
const errors_1 = require("../errors");
async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || typeof authHeader !== 'string') {
            throw new errors_1.UnauthorizedError('Access denied. No token provided.');
        }
        if (!authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Authorization header must be: Bearer <token>.');
        }
        const token = authHeader.slice(7).trim();
        if (!token) {
            throw new errors_1.UnauthorizedError('No token provided.');
        }
        // Verify token with Supabase
        const { data: { user: supabaseUser }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !supabaseUser) {
            throw new errors_1.UnauthorizedError('Invalid or expired token.');
        }
        // Fetch user profile from our database
        const { rows } = await (0, database_1.query)('SELECT id, email, full_name, email_verified FROM user_profiles WHERE id = $1', [supabaseUser.id]);
        if (rows.length === 0) {
            // User exists in Supabase Auth but not in our profiles table yet
            // This happens right after signup before onboarding
            const authUser = {
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.full_name || '',
                emailVerified: !!supabaseUser.email_confirmed_at,
            };
            req.user = authUser;
            return next();
        }
        const profile = rows[0];
        const authUser = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            emailVerified: profile.email_verified,
        };
        req.user = authUser;
        next();
    }
    catch (err) {
        next(err);
    }
}
/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
async function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        await authenticate(req, _res, next);
    }
    catch {
        // Token invalid — continue without user
        next();
    }
}
//# sourceMappingURL=authenticate.js.map