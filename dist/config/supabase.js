"use strict";
/**
 * Supabase client — used ONLY for authentication.
 * All data operations go through the pg pool directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabasePublic = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
/**
 * Admin client — uses service role key for user management
 * (verify tokens, delete users, etc.)
 */
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
/**
 * Public client — uses anon key for client-side–like operations
 * (signup, login, OAuth)
 */
exports.supabasePublic = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
//# sourceMappingURL=supabase.js.map