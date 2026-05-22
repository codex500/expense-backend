/**
 * Money utility — all monetary calculations use integer paise/cents.
 *
 * RULE: Money is ALWAYS stored and calculated as BIGINT (paise).
 *       ₹500.25 → 50025 integer
 *       No floating-point arithmetic.
 */

/**
 * Convert a decimal amount (e.g., 500.25) to integer paise/cents.
 * Uses integer-safe multiplication to avoid floating-point errors.
 */
export function toPaise(amount: number | string): number {
  const str = String(amount).trim();
  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;
  const parts = cleanStr.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  const frac = parseInt((parts[1] || '00').padEnd(2, '0').slice(0, 2), 10);
  const absolutePaise = whole * 100 + frac;
  return isNegative ? -absolutePaise : absolutePaise;
}

/**
 * Convert integer paise/cents back to decimal for display.
 */
export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Format paise as currency string (e.g., 50025 → "₹500.25").
 */
export function formatPaise(paise: number, currencySymbol: string = '₹'): string {
  const decimal = fromPaise(paise);
  return `${currencySymbol}${decimal.toFixed(2)}`;
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
  return Math.round((spentPaise / budgetPaise) * 100);
}

/**
 * Calculate percentage change between two periods.
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
