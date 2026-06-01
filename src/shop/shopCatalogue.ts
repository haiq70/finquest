// ────────────────────────────────────────────────────────────────────
// Shop catalogue
//
// Everything here is a *gameplay modifier* — there are no cosmetics.
// Each item is themed around the finance-dating premise: spend the
// FinCoins you earn by saving on little gestures and date nights that
// move your progress (and your companion) forward.
//
// ShopItemType:
//   streak_freeze  — covers a missed day so your streak survives
//                    (used automatically, Duolingo-style)
//   xp_booster     — a "date" that temporarily multiplies all XP earned
//   coin_magnet    — a token of good fortune: bonus coins for a period
// ────────────────────────────────────────────────────────────────────

export type ShopItemType =
  | 'xp_booster'
  | 'streak_freeze'
  | 'coin_magnet';

export type ShopItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ShopItemType;
  rarity: ShopItemRarity;
  price: number; // in coins (FC)
  // For consumables: how many uses per purchase
  uses?: number;
  // For timed effects: duration in hours
  durationHours?: number;
  // For XP boosters: multiplier applied on top of existing multiplier
  xpMultiplier?: number;
  // For coin magnets: bonus percentage (0.5 = +50% coins)
  coinBonus?: number;
  // Max owned at once (streak freezes cap at 2 like Duolingo)
  maxOwned?: number;
}

// ── Catalogue ────────────────────────────────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [

  // ── Streak Savers ────────────────────────────────────────────────
  // Reschedule, don't cancel — protect the daily rhythm of showing up.
  {
    id: 'streak_freeze_1',
    name: 'Rain Check',
    description: 'Reschedule, don\'t cancel. Covers one missed day so your streak stays intact — used automatically when you skip.',
    icon: '🌂',
    type: 'streak_freeze',
    rarity: 'common',
    price: 200,
    uses: 1,
    maxOwned: 2,
  },
  {
    id: 'streak_freeze_3',
    name: 'Love Letters',
    description: 'Three rain checks at a discount. Stay close through a busy week without breaking your streak.',
    icon: '💌',
    type: 'streak_freeze',
    rarity: 'rare',
    price: 500,
    uses: 3,
    maxOwned: 2,
  },

  // ── Date Nights ──────────────────────────────────────────────────
  // Quality time deepens the bond → more XP while it lasts.
  {
    id: 'xp_boost_1h',
    name: 'Coffee Date',
    description: 'An hour together over coffee — double XP for 1 hour.',
    icon: '☕',
    type: 'xp_booster',
    rarity: 'common',
    price: 300,
    uses: 1,
    durationHours: 1,
    xpMultiplier: 2.0,
  },
  {
    id: 'xp_boost_24h',
    name: 'Day Out Together',
    description: 'A whole day side by side — double XP for 24 hours. Perfect for a big saving push.',
    icon: '💞',
    type: 'xp_booster',
    rarity: 'rare',
    price: 750,
    uses: 1,
    durationHours: 24,
    xpMultiplier: 2.0,
  },
  {
    id: 'xp_boost_mega',
    name: 'Candlelit Dinner',
    description: 'An unforgettable evening — triple XP for 6 hours. Her heart is racing.',
    icon: '🍷',
    type: 'xp_booster',
    rarity: 'epic',
    price: 1500,
    uses: 1,
    durationHours: 6,
    xpMultiplier: 3.0,
  },

  // ── Good Fortune ─────────────────────────────────────────────────
  // A little luck stretches every coin you earn.
  {
    id: 'coin_magnet_24h',
    name: 'Wishing Coin',
    description: 'A coin tossed in the fountain, wishing you well — earn 50% more FC for 24 hours.',
    icon: '🪙',
    type: 'coin_magnet',
    rarity: 'rare',
    price: 600,
    uses: 1,
    durationHours: 24,
    coinBonus: 0.5,
  },
];

export const SHOP_ITEM_MAP: Record<string, ShopItem> =
  Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));

// ── Visual helpers ────────────────────────────────────────────────────

export const SHOP_RARITY_COLORS: Record<ShopItemRarity, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: '#f8fafc', border: '#e2e8f0', text: '#475569',  glow: '#cbd5e1' },
  rare:      { bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed',  glow: '#c4b5fd' },
  epic:      { bg: '#fdf4ff', border: '#e9d5ff', text: '#a21caf',  glow: '#e879f9' },
  legendary: { bg: '#fffbeb', border: '#fde68a', text: '#b45309',  glow: '#fcd34d' },
};

export const ITEM_TYPE_LABELS: Record<ShopItemType, string> = {
  xp_booster:       'Date Night',
  streak_freeze:    'Streak Saver',
  coin_magnet:      'Good Fortune',
};

export const ITEM_TYPE_ICONS: Record<ShopItemType, string> = {
  xp_booster:       '💞',
  streak_freeze:    '🌂',
  coin_magnet:      '🪙',
};

// A compact, at-a-glance summary of what an item actually does, derived
// from its mechanical fields. Shown on the shop grid cards so players
// don't have to open the detail sheet to understand an item.
export function effectSummary(item: ShopItem): string {
  switch (item.type) {
    case 'streak_freeze': {
      const days = item.uses ?? 1;
      return `Covers ${days} missed day${days > 1 ? 's' : ''}`;
    }
    case 'xp_booster': {
      const mult = item.xpMultiplier ?? 1;
      return `${mult}× XP · ${item.durationHours}h`;
    }
    case 'coin_magnet': {
      const pct = Math.round((item.coinBonus ?? 0) * 100);
      return `+${pct}% FC · ${item.durationHours}h`;
    }
    default:
      return '';
  }
}
