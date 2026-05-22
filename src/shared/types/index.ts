/**
 * Global type definitions used across all modules.
 */

import { Request } from 'express';

/** Authenticated user attached to request by auth middleware */
export interface AuthUser {
  id: string;          // Supabase auth.users UUID
  email: string;
  name: string;
  emailVerified: boolean;
}

/** Extended Express Request with authenticated user */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Account types */
export type AccountType = 'cash' | 'upi' | 'bank_account' | 'credit_card' | 'wallet';

/** Transaction types */
export type TransactionType = 'income' | 'expense' | 'transfer';

/** Budget scope */
export type BudgetScope = 'overall' | 'category' | 'account';

/** Notification types */
export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'monthly_report'
  | 'weekly_summary'
  | 'welcome'
  | 'general';

/** Theme preference */
export type ThemePreference = 'light' | 'dark' | 'system';
