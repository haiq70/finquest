export const Colors = {
  dark: '#1a1a2e',
  primary: '#6366f1',
  primaryLight: '#e0e7ff',
  income: '#22c55e',
  incomeLight: '#dcfce7',
  expense: '#ef4444',
  expenseLight: '#fee2e2',
  surface: '#ffffff',
  background: '#f4f4f8',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  gold: '#f59e0b',
  silver: '#94a3b8',
  bronze: '#b45309',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export type Category =
  | '🍔 Food'
  | '🚗 Transport'
  | '🎬 Fun'
  | '🏠 Home'
  | '🏥 Health'
  | '💼 Salary'
  | '💰 Freelance'
  | '📦 Other';

export const CATEGORIES: Category[] = [
  '🍔 Food',
  '🚗 Transport',
  '🎬 Fun',
  '🏠 Home',
  '🏥 Health',
  '💼 Salary',
  '💰 Freelance',
  '📦 Other',
];

export const EXPENSE_CATEGORIES: Category[] = [
  '🍔 Food',
  '🚗 Transport',
  '🎬 Fun',
  '🏠 Home',
  '🏥 Health',
  '📦 Other',
];

export const INCOME_CATEGORIES: Category[] = [
  '💼 Salary',
  '💰 Freelance',
  '📦 Other',
];

export const CategoryMeta: Record<Category, { bg: string; bar: string }> = {
  '🍔 Food':      { bg: '#fff7ed', bar: '#6366f1' },
  '🚗 Transport': { bg: '#eff6ff', bar: '#06b6d4' },
  '🎬 Fun':       { bg: '#fdf4ff', bar: '#8b5cf6' },
  '🏠 Home':      { bg: '#f0fdf4', bar: '#22c55e' },
  '🏥 Health':    { bg: '#fff1f2', bar: '#ef4444' },
  '💼 Salary':    { bg: '#f0fdf4', bar: '#f59e0b' },
  '💰 Freelance': { bg: '#fefce8', bar: '#84cc16' },
  '📦 Other':     { bg: '#f8fafc', bar: '#94a3b8' },
};

export const XP_PER_TX = 20;
export const XP_PER_LEVEL = 500;
export const BASE_BALANCE = 0;
