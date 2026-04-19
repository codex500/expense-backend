"use strict";
/**
 * Money utility — all monetary calculations use integer paise/cents.
 *
 * RULE: Money is ALWAYS stored and calculated as BIGINT (paise).
 *       ₹500.25 → 50025 integer
 *       $12.99  → 1299 integer
 *
 * This module provides safe conversion and arithmetic helpers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaise = toPaise;
exports.fromPaise = fromPaise;
exports.formatPaise = formatPaise;
exports.addPaise = addPaise;
exports.subtractPaise = subtractPaise;
exports.isValidPaise = isValidPaise;
exports.canDeduct = canDeduct;
exports.percentageUsed = percentageUsed;
exports.percentageChange = percentageChange;
const decimal_js_1 = __importDefault(require("decimal.js"));
// Configure Decimal.js for financial precision
decimal_js_1.default.set({ precision: 20, rounding: decimal_js_1.default.ROUND_HALF_UP });
/**
 * Convert a decimal amount (e.g., 500.25) to integer paise/cents.
 * Uses Decimal.js to avoid floating-point errors.
 */
function toPaise(amount) {
    const d = new decimal_js_1.default(amount);
    return d.times(100).round().toNumber();
}
/**
 * Convert integer paise/cents back to decimal for display.
 */
function fromPaise(paise) {
    return new decimal_js_1.default(paise).dividedBy(100).toNumber();
}
/**
 * Format paise as currency string (e.g., 50025 → "500.25").
 */
function formatPaise(paise, currencySymbol = '₹') {
    const decimal = fromPaise(paise);
    return `${currencySymbol}${decimal.toFixed(2)}`;
}
/**
 * Safe addition of two paise amounts.
 */
function addPaise(a, b) {
    return a + b;
}
/**
 * Safe subtraction of two paise amounts.
 * Returns the result — caller must check for negative.
 */
function subtractPaise(a, b) {
    return a - b;
}
/**
 * Check if an amount in paise is valid (positive integer).
 */
function isValidPaise(paise) {
    return Number.isInteger(paise) && paise > 0;
}
/**
 * Validate that a balance won't go negative after a deduction.
 */
function canDeduct(currentBalancePaise, amountPaise) {
    return currentBalancePaise >= amountPaise;
}
/**
 * Calculate percentage of budget used.
 */
function percentageUsed(spentPaise, budgetPaise) {
    if (budgetPaise <= 0)
        return 0;
    return new decimal_js_1.default(spentPaise).dividedBy(budgetPaise).times(100).round().toNumber();
}
/**
 * Calculate percentage change between two periods.
 */
function percentageChange(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return new decimal_js_1.default(current - previous)
        .dividedBy(previous)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
}
//# sourceMappingURL=money.js.map