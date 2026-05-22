/**
 * Supabase clients — used for authentication.
 * All data operations go through the pg pool directly.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Admin client — uses service role key for user management
 * (verify tokens, create users, delete users, etc.)
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Public client — uses anon key for client-side–like operations
 * (signup, login, OAuth redirects)
 */
export const supabasePublic = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
