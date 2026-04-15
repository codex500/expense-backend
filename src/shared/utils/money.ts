/**
 * Money utility — all monetary calculations use integer paise/cents.
 *
 * RULE: Money is ALWAYS stored and calculated as BIGINT (paise).
 *       ₹500.25 → 50025 integer
 *       $12.99  → 1299 integer
 *
 * This module provides safe conversion and arithmetic helpers.
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert a decimal amount (e.g., 500.25) to integer paise/cents.
 * Uses Decimal.js to avoid floating-point errors.
 */
export function toPaise(amount: number | string): number {
  const d = new Decimal(amount);
  return d.times(100).round().toNumber();
}

/**
 * Convert integer paise/cents back to decimal for display.
 */
export function fromPaise(paise: number): number {
  return new Decimal(paise).dividedBy(100).toNumber();
}

/**
 * Format paise as currency string (e.g., 50025 → "500.25").
 */
export function formatPaise(paise: number, currencySymbol: string = '₹'): string {
  const decimal = fromPaise(paise);
  return `${currencySymbol}${decimal.toFixed(2)}`;
}

/**
 * Safe addition of two paise amounts.
 */
export function addPaise(a: number, b: number): number {
  return a + b;
}

/**
 * Safe subtraction of two paise amounts.
 * Returns the result — caller must check for negative.
 */
export function subtractPaise(a: number, b: number): number {
  return a - b;
}

/**
 * Check if an amount in paise is valid (positive integer).
 */
export function isValidPaise(paise: number): boolean {
  return Number.isInteger(paise) && paise > 0;
}

/**
 * Validate that a balance won't go negative after a deduction.
 */
export function canDeduct(currentBalancePaise: number, amountPaise: number): boolean {
  return currentBalancePaise >= amountPaise;
}

/**
 * Calculate percentage of budget used.
 */
export function percentageUsed(spentPaise: number, budgetPaise: number): number {
  if (budgetPaise <= 0) return 0;
  return new Decimal(spentPaise).dividedBy(budgetPaise).times(100).round().toNumber();
}

/**
 * Calculate percentage change between two periods.
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return new Decimal(current - previous)
    .dividedBy(previous)
    .times(100)
    .toDecimalPlaces(1)
    .toNumber();
}
