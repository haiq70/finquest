// ────────────────────────────────────────────────────────────────────
// Currency options.
//
// The app tracks raw amounts; switching currency only changes the symbol
// shown — it does NOT convert values (there are no exchange rates here).
// ────────────────────────────────────────────────────────────────────

export type CurrencyCode =
  | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD' | 'CHF';

export interface CurrencyDef {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyDef> =
  Object.fromEntries(CURRENCIES.map(c => [c.code, c])) as Record<CurrencyCode, CurrencyDef>;

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_MAP[code]?.symbol ?? '€';
}
