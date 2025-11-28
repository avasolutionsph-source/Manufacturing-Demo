// Philippine Peso currency formatting utilities

export const CURRENCY_CODE = 'PHP';
export const CURRENCY_SYMBOL = '₱';
export const LOCALE = 'en-PH';

/**
 * Format a number as Philippine Peso
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with peso symbol (shorter format)
 */
export function formatPeso(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number as compact currency (e.g., ₱1.2M)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${CURRENCY_SYMBOL}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${CURRENCY_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  }
  return formatPeso(amount);
}

/**
 * Parse a currency string back to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₱,\s]/g, '');
  return parseFloat(cleaned) || 0;
}
