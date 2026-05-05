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
  user?: any;
  body: any;
  params: any;
  query: any;
  headers: any;
}

/** Standard API response envelope */
export interface ApiResponse<T = any> {
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
  | 'salary_reminder'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'monthly_report'
  | 'weekly_summary'
  | 'low_balance'
  | 'recurring_payment'
  | 'welcome'
  | 'general';

/** Email template types */
export type EmailTemplateType =
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'daily_reminder'
  | 'budget_warning'
  | 'salary_reminder'
  | 'weekly_summary'
  | 'monthly_report'
  | 'low_balance';

/** Theme preference */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Default transaction categories */
export const DEFAULT_CATEGORIES = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Entertainment',
  'Salary',
  'EMI',
  'Health',
  'Education',
  'Other',
] as const;
