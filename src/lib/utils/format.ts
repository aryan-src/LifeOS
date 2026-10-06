/**
 * Deterministic currency and number formatters.
 * Strictly uses 'en-US' locale across both Node.js SSR and client browser
 * to prevent React hydration attribute and text mismatches.
 */

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  return abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(val: number): string {
  return val.toLocaleString('en-US');
}
