/**
 * Money utility — all monetary calculations use integer paise/cents.
 *
 * RULE: Money is ALWAYS stored and calculated as BIGINT (paise).
 *       ₹500.25 → 50025 integer
 *       $12.99  → 1299 integer
 *
 * This module provides safe conversion and arithmetic helpers.
 */
/**
 * Convert a decimal amount (e.g., 500.25) to integer paise/cents.
 * Uses Decimal.js to avoid floating-point errors.
 */
export declare function toPaise(amount: number | string): number;
/**
 * Convert integer paise/cents back to decimal for display.
 */
export declare function fromPaise(paise: number): number;
/**
 * Format paise as currency string (e.g., 50025 → "500.25").
 */
export declare function formatPaise(paise: number, currencySymbol?: string): string;
/**
 * Safe addition of two paise amounts.
 */
export declare function addPaise(a: number, b: number): number;
/**
 * Safe subtraction of two paise amounts.
 * Returns the result — caller must check for negative.
 */
export declare function subtractPaise(a: number, b: number): number;
/**
 * Check if an amount in paise is valid (positive integer).
 */
export declare function isValidPaise(paise: number): boolean;
/**
 * Validate that a balance won't go negative after a deduction.
 */
export declare function canDeduct(currentBalancePaise: number, amountPaise: number): boolean;
/**
 * Calculate percentage of budget used.
 */
export declare function percentageUsed(spentPaise: number, budgetPaise: number): number;
/**
 * Calculate percentage change between two periods.
 */
export declare function percentageChange(current: number, previous: number): number;
//# sourceMappingURL=money.d.ts.map