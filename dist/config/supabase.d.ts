/**
 * Supabase client — used ONLY for authentication.
 * All data operations go through the pg pool directly.
 */
/**
 * Admin client — uses service role key for user management
 * (verify tokens, delete users, etc.)
 */
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
/**
 * Public client — uses anon key for client-side–like operations
 * (signup, login, OAuth)
 */
export declare const supabasePublic: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
//# sourceMappingURL=supabase.d.ts.map