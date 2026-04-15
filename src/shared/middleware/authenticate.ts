/**
 * Authentication middleware — validates Supabase JWT tokens.
 * Attaches the authenticated user to req.user.
 */

import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { query } from '../../config/database';
import { UnauthorizedError } from '../errors';
import { AuthenticatedRequest, AuthUser } from '../types';

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedError('Access denied. No token provided.');
    }
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header must be: Bearer <token>.');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError('No token provided.');
    }

    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new UnauthorizedError('Invalid or expired token.');
    }

    // Fetch user profile from our database
    const { rows } = await query<{
      id: string;
      email: string;
      full_name: string;
      email_verified: boolean;
    }>(
      'SELECT id, email, full_name, email_verified FROM user_profiles WHERE id = $1',
      [supabaseUser.id]
    );

    if (rows.length === 0) {
      // User exists in Supabase Auth but not in our profiles table yet
      // This happens right after signup before onboarding
      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || '',
        emailVerified: !!supabaseUser.email_confirmed_at,
      };
      req.user = authUser;
      return next();
    }

    const profile = rows[0];
    const authUser: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      emailVerified: profile.email_verified,
    };

    req.user = authUser;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    await authenticate(req, _res, next);
  } catch {
    // Token invalid — continue without user
    next();
  }
}
