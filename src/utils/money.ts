import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { currencySymbol } from './currency';
import { fmtCurrency } from './format';

/**
 * Returns a currency formatter bound to the user's chosen currency.
 * Subscribing to `currency` here means any component using the returned
 * formatter re-renders when the currency setting changes.
 */
export function useMoney(): (amount: number) => string {
  const symbol = useStore(s => currencySymbol(s.currency));
  return useCallback((amount: number) => fmtCurrency(amount, symbol), [symbol]);
}

/** Just the active currency symbol, for inline labels like "Amount (€)". */
export function useCurrencySymbol(): string {
  return useStore(s => currencySymbol(s.currency));
}
