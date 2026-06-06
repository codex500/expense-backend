import { RequestHandler, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { query } from '../../config/database';
import { UnauthorizedError } from '../errors';
import { AuthenticatedRequest, AuthUser } from '../types';

async function verifyToken(req: Request): Promise<AuthUser> {
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

  let userId: string = '';
  let jwtEmail = '';
  let jwtName = '';

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    const jwt = require('jsonwebtoken');
    try {
      const decodedUser = jwt.verify(token, jwtSecret);
      userId = decodedUser.sub;
      jwtEmail = decodedUser.email || '';
      jwtName = decodedUser.user_metadata?.full_name || '';
    } catch (err) {
      // Local verification failed (maybe wrong JWT_SECRET). We will fallback to Supabase API below.
    }
  }

  if (!userId) {
    // Fallback to calling Supabase API directly to validate the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token.');
    }
    userId = user.id;
    jwtEmail = user.email || '';
    jwtName = user.user_metadata?.full_name || '';
  }

  if (!userId) {
    throw new UnauthorizedError('Invalid token payload.');
  }

  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string;
    is_admin: boolean;
  }>(
    'SELECT id, email, full_name, is_admin FROM user_profiles WHERE id = $1',
    [userId]
  );

  if (rows.length === 0) {
    return {
      id: userId,
      email: jwtEmail,
      name: jwtName,
      emailVerified: true, // If they have a valid token, assume verified
      isAdmin: false
    };
  }

  const profile = rows[0];
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    emailVerified: true,
    isAdmin: profile.is_admin === true
  };
}

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authUser = await verifyToken(req);
    (req as AuthenticatedRequest).user = authUser;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const authUser = await verifyToken(req);
      (req as AuthenticatedRequest).user = authUser;
    }
    next();
  } catch {
    next();
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const authUser = await verifyToken(req);
    if (!authUser.isAdmin) {
      throw new UnauthorizedError('Access denied. Administrator privileges required.');
    }
    (req as AuthenticatedRequest).user = authUser;
    next();
  } catch (err) {
    next(err);
  }
};
