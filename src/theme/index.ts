export const Colors = {
  dark:          '#4c1d95',  // deep purple (was navy) — used for hero cards, dark fills
  primary:       '#a855f7',  // lavender accent
  primaryLight:  '#f3e8ff',  // pale lavender fill
  income:        '#22c55e',
  incomeLight:   '#dcfce7',
  expense:       '#ef4444',
  expenseLight:  '#fee2e2',
  surface:       '#ffffff',
  background:    '#faf5ff',  // page background — soft lavender (was off-white)
  border:        '#ede9fe',  // pastel lavender border (was cool grey)
  textPrimary:   '#3b0764',  // deep aubergine (was near-black)
  textSecondary: '#7e22ce',  // muted purple (was cool grey)
  textMuted:     '#a78bfa',  // soft lavender (was light grey)
  gold:          '#f59e0b',
  silver:        '#a78bfa',
  bronze:        '#ec4899',  // pink for 3rd place to fit palette
  purple:        '#a855f7',
  cyan:          '#ec4899',  // re-used as pink accent in some chart bars
  pink:          '#ec4899',
  pinkDeep:      '#be185d',
  accentDeep:    '#7c3aed',
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

// ── Glass / frosted-panel design tokens ─────────────────────────────
// Used by the reskin so every screen renders translucent "glass" panels
// floating over the room background, instead of solid white cards.
// Designed to read as glass even where expo-blur falls back to a plain
// translucent fill (Android on SDK 54).
export const Glass = {
  // Panel fills (layered over the BlurView tint)
  fill:        'rgba(255,255,255,0.55)',  // standard frosted panel
  fillStrong:  'rgba(255,255,255,0.72)',  // when content needs more contrast
  fillSubtle:  'rgba(255,255,255,0.35)',  // faint chips / secondary panels
  fillDark:    'rgba(76,29,149,0.42)',    // purple-tinted glass (hero/accent)
  // Borders — a bright top edge sells the glass look
  border:      'rgba(255,255,255,0.65)',
  borderSoft:  'rgba(255,255,255,0.4)',
  // Blur tints for <BlurView tint=...>
  tint:        'light' as const,
  intensity:   40,
  // Glow shadow for floating panels
  glow: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  // Room background gradient stops (top → bottom): dusk lavender → pink
  bgGradient: ['#ede9fe', '#f5e1f5', '#fce7f3'] as const,
  bgGradientDusk: ['#d8c9f5', '#e9d5f0', '#f7d9e8'] as const,
} as const;

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
  '🍔 Food':      { bg: '#fef3c7', bar: '#f59e0b' },
  '🚗 Transport': { bg: '#dbeafe', bar: '#3b82f6' },
  '🎬 Fun':       { bg: '#fce7f3', bar: '#ec4899' },
  '🏠 Home':      { bg: '#dcfce7', bar: '#22c55e' },
  '🏥 Health':    { bg: '#fee2e2', bar: '#ef4444' },
  '💼 Salary':    { bg: '#ede9fe', bar: '#a855f7' },
  '💰 Freelance': { bg: '#f3e8ff', bar: '#8b5cf6' },
  '📦 Other':     { bg: '#f3e8ff', bar: '#a78bfa' },
};

export const XP_PER_TX = 20;
export const XP_PER_LEVEL = 500;
export const BASE_BALANCE = 0;
