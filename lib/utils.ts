import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert minor units (cents) to a human-readable string. We store all
 * monetary amounts as BIGINT cents in the DB. For VND, the base unit IS the
 * cent (no fractional unit) so this is mostly a thousands separator.
 */
export function formatCents(cents: bigint, currency: 'VND' | 'USD' = 'VND'): string {
  const value = currency === 'VND' ? Number(cents) : Number(cents) / 100;
  return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value);
}

export function toCents(amount: number, currency: 'VND' | 'USD' = 'VND'): bigint {
  return currency === 'VND' ? BigInt(Math.round(amount)) : BigInt(Math.round(amount * 100));
}
