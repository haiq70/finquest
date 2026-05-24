// ────────────────────────────────────────────────────────────────────
// Shop catalogue
//
// ShopItem types:
//   avatar_accessory  — cosmetic item that can be equipped on Kasumi
//   xp_booster        — temporarily multiplies all XP earned
//   streak_freeze     — consumes instead of breaking a streak on a
//                       missed day (Duolingo mechanic)
//   coin_magnet       — earns bonus coins for a period
// ────────────────────────────────────────────────────────────────────

export type ShopItemType =
  | 'avatar_accessory'
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
  // For avatar accessories: which slot this equips to
  slot?: AvatarSlot;
  // For accessories: CSS-like colour hint used to tint the badge
  tint?: string;
  // Max owned at once (streak freezes cap at 2 like Duolingo)
  maxOwned?: number;
}

export type AvatarSlot = 'head' | 'background' | 'badge' | 'outfit';

// ── Catalogue ────────────────────────────────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [

  // ── Streak Freezes ───────────────────────────────────────────────
  {
    id: 'streak_freeze_1',
    name: 'Streak Freeze',
    description: 'Protects your streak for one missed day. Used automatically when you skip a day.',
    icon: '🧊',
    type: 'streak_freeze',
    rarity: 'common',
    price: 200,
    uses: 1,
    maxOwned: 2,
  },
  {
    id: 'streak_freeze_3',
    name: 'Freeze Pack',
    description: 'Three streak freezes at a discount. Stack up before a busy week.',
    icon: '❄️',
    type: 'streak_freeze',
    rarity: 'rare',
    price: 500,
    uses: 3,
    maxOwned: 2,
  },

  // ── XP Boosters ──────────────────────────────────────────────────
  {
    id: 'xp_boost_1h',
    name: 'XP Rush',
    description: 'All XP earned is doubled for 1 hour.',
    icon: '⚡',
    type: 'xp_booster',
    rarity: 'common',
    price: 300,
    uses: 1,
    durationHours: 1,
    xpMultiplier: 2.0,
  },
  {
    id: 'xp_boost_24h',
    name: 'XP Surge',
    description: 'All XP earned is doubled for 24 hours — perfect for a big saving day.',
    icon: '🌟',
    type: 'xp_booster',
    rarity: 'rare',
    price: 750,
    uses: 1,
    durationHours: 24,
    xpMultiplier: 2.0,
  },
  {
    id: 'xp_boost_mega',
    name: 'MEGA Boost',
    description: 'Triple XP for 6 hours. Kasumi is very impressed.',
    icon: '💥',
    type: 'xp_booster',
    rarity: 'epic',
    price: 1500,
    uses: 1,
    durationHours: 6,
    xpMultiplier: 3.0,
  },

  // ── Coin Magnets ─────────────────────────────────────────────────
  {
    id: 'coin_magnet_24h',
    name: 'Coin Magnet',
    description: 'Earn 50% more coins on all actions for 24 hours.',
    icon: '🧲',
    type: 'coin_magnet',
    rarity: 'rare',
    price: 600,
    uses: 1,
    durationHours: 24,
    coinBonus: 0.5,
  },

  // ── Avatar Accessories ───────────────────────────────────────────
  {
    id: 'acc_halo',
    name: 'Golden Halo',
    description: 'A halo that glows when Kasumi is happy.',
    icon: '😇',
    type: 'avatar_accessory',
    rarity: 'rare',
    price: 800,
    slot: 'head',
    tint: '#f59e0b',
  },
  {
    id: 'acc_crown',
    name: 'Crown',
    description: 'Reserved for those who take saving seriously.',
    icon: '👑',
    type: 'avatar_accessory',
    rarity: 'epic',
    price: 1800,
    slot: 'head',
    tint: '#f59e0b',
  },
  {
    id: 'acc_stars',
    name: 'Star Shower',
    description: 'Animated star background for Kasumi\'s card.',
    icon: '✨',
    type: 'avatar_accessory',
    rarity: 'common',
    price: 350,
    slot: 'background',
    tint: '#a78bfa',
  },
  {
    id: 'acc_sakura',
    name: 'Sakura Garden',
    description: 'Cherry blossom background. She loves this one.',
    icon: '🌸',
    type: 'avatar_accessory',
    rarity: 'rare',
    price: 900,
    slot: 'background',
    tint: '#ec4899',
  },
  {
    id: 'acc_galaxy',
    name: 'Galaxy',
    description: 'A deep purple galaxy surrounds Kasumi.',
    icon: '🌌',
    type: 'avatar_accessory',
    rarity: 'epic',
    price: 2000,
    slot: 'background',
    tint: '#7c3aed',
  },
  {
    id: 'acc_badge_gold',
    name: 'Gold Badge',
    description: 'A shimmering gold badge on Kasumi\'s card.',
    icon: '🥇',
    type: 'avatar_accessory',
    rarity: 'common',
    price: 400,
    slot: 'badge',
    tint: '#f59e0b',
  },
  {
    id: 'acc_badge_diamond',
    name: 'Diamond Badge',
    description: 'Extremely rare. Shows true dedication.',
    icon: '💎',
    type: 'avatar_accessory',
    rarity: 'legendary',
    price: 5000,
    slot: 'badge',
    tint: '#06b6d4',
  },
  {
    id: 'acc_outfit_kimono',
    name: 'Kimono',
    description: 'A traditional kimono for Kasumi. She is honoured.',
    icon: '👘',
    type: 'avatar_accessory',
    rarity: 'epic',
    price: 2500,
    slot: 'outfit',
    tint: '#ec4899',
  },
  {
    id: 'acc_outfit_casual',
    name: 'Casual Look',
    description: 'She says she dressed up for you. She did.',
    icon: '🧥',
    type: 'avatar_accessory',
    rarity: 'rare',
    price: 1000,
    slot: 'outfit',
    tint: '#8b5cf6',
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
  avatar_accessory: 'Avatar',
  xp_booster:       'XP Booster',
  streak_freeze:    'Streak Freeze',
  coin_magnet:      'Coin Magnet',
};

export const ITEM_TYPE_ICONS: Record<ShopItemType, string> = {
  avatar_accessory: '🎨',
  xp_booster:       '⚡',
  streak_freeze:    '🧊',
  coin_magnet:      '🧲',
};
