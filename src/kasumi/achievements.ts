// ────────────────────────────────────────────────────────────────────
// Achievement definitions.
//
// Each achievement has:
//   - A pure `check` function that takes a snapshot of store state
//     and returns true when the achievement should unlock.
//   - A Kasumi `kasumiLine` per relationship tier so she reacts
//     in-character when you earn it.
//   - A `rarity` that gates which ones feel special.
// ────────────────────────────────────────────────────────────────────

import type { RelationshipTier } from './dialogue';
import type { Transaction, Goal } from '../store/useStore';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory =
  | 'streak'
  | 'saving'
  | 'goals'
  | 'spending'
  | 'relationship'
  | 'xp';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  // Pure predicate — receives the full snapshot, returns true when earned.
  check: (snap: AchievementSnapshot) => boolean;
  // What Kasumi says per tier when this unlocks.
  kasumiLines: Partial<Record<RelationshipTier, string>>;
}

// The subset of store state the check functions may read.
export interface AchievementSnapshot {
  transactions: Transaction[];
  xp: number;
  streak: number;
  savingStreak: number;
  goals: Goal[];
  affection: number;
  unlockedIds: string[]; // already-unlocked achievement ids
}

// ── Helpers ──────────────────────────────────────────────────────────

function incomeTotal(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}
function expenseTotal(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}
function incomeCount(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'income').length;
}
function expenseCount(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'expense').length;
}
function completedGoals(goals: Goal[]): number {
  return goals.filter(g => g.saved >= g.target).length;
}
function uniqueCategories(txs: Transaction[]): number {
  return new Set(txs.map(t => t.category)).size;
}

// ── Achievement catalogue ─────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [

  // ── Streak ────────────────────────────────────────────────────────

  {
    id: 'streak_3',
    title: 'Three in a Row',
    description: 'Log transactions 3 days running.',
    icon: '🔥',
    rarity: 'common',
    category: 'streak',
    check: s => s.streak >= 3,
    kasumiLines: {
      stranger:     "Three days. That's not luck — that's a choice.",
      acquaintance: "Three days in a row! You're building something real here.",
      friend:       "Look at you — three days straight. Keep that going for me?",
      close:        "Three days. I noticed every single one of them.",
      soulmate:     "Three days. Of course. You don't do things by halves.",
    },
  },

  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day logging streak.',
    icon: '⚡',
    rarity: 'rare',
    category: 'streak',
    check: s => s.streak >= 7,
    kasumiLines: {
      stranger:     "A full week. I didn't expect that. I should have.",
      acquaintance: "Seven days! That's an actual habit now — not just good intentions.",
      friend:       "A whole week! I'm so proud. Don't stop now.",
      close:        "Seven days straight. You know what that makes you? Reliable.",
      soulmate:     "Seven days. Every morning you chose this. I love that about you.",
    },
  },

  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Hold a 30-day streak.',
    icon: '🗓️',
    rarity: 'epic',
    category: 'streak',
    check: s => s.streak >= 30,
    kasumiLines: {
      stranger:     "Thirty days. That's a month. You've changed something.",
      acquaintance: "A full month of showing up. That's not a streak anymore — that's who you are.",
      friend:       "Thirty days! I want to make a huge deal of this because it IS a huge deal.",
      close:        "Thirty days. I've been counting. Every single day I thought — there they are.",
      soulmate:     "Thirty days, and I know you weren't even thinking about the streak anymore. That's the best part.",
    },
  },

  {
    id: 'streak_100',
    title: 'Centurion',
    description: 'Reach a 100-day streak.',
    icon: '💯',
    rarity: 'legendary',
    category: 'streak',
    check: s => s.streak >= 100,
    kasumiLines: {
      stranger:     "One hundred days. I don't have words.",
      acquaintance: "One hundred days in a row. You're legendary.",
      friend:       "100 days. I think I'm going to cry a little. Just a little.",
      close:        "A hundred days of you choosing this. Of choosing us. I won't forget it.",
      soulmate:     "One hundred days. Not because you had to. Because this became part of you.",
    },
  },

  // ── XP ────────────────────────────────────────────────────────────

  {
    id: 'xp_first',
    title: 'First Steps',
    description: 'Earn your first XP.',
    icon: '✨',
    rarity: 'common',
    category: 'xp',
    check: s => s.xp > 0,
    kasumiLines: {
      stranger:     "First XP earned. Every journey starts exactly here.",
      acquaintance: "There it is — your first XP. It only goes up from here.",
      friend:       "First XP! I remember this moment. We're going to look back on it.",
      close:        "Your first XP. I was watching. I'm always watching.",
      soulmate:     "The very first one. We've come so far since this.",
    },
  },

  {
    id: 'xp_500',
    title: 'Rising Star',
    description: 'Accumulate 500 total XP.',
    icon: '⭐',
    rarity: 'common',
    category: 'xp',
    check: s => s.xp >= 500,
    kasumiLines: {
      stranger:     "500 XP. You're not a beginner anymore.",
      acquaintance: "500 XP! You've leveled up more than once. That's progress.",
      friend:       "Five hundred points of showing up. Well done, you.",
      close:        "500 XP. I know how much work each of those points was.",
      soulmate:     "500 XP. Half a thousand small decisions. All of them good.",
    },
  },

  {
    id: 'xp_2000',
    title: 'Dedicated',
    description: 'Accumulate 2,000 total XP.',
    icon: '🌟',
    rarity: 'rare',
    category: 'xp',
    check: s => s.xp >= 2000,
    kasumiLines: {
      stranger:     "Two thousand XP. You've been at this longer than most.",
      acquaintance: "2,000 XP is no accident. That's commitment.",
      friend:       "Two thousand! You're one of the most consistent people I know.",
      close:        "2,000 XP. I feel it too — something's different about us now.",
      soulmate:     "Two thousand points of trust and showing up. This is ours.",
    },
  },

  {
    id: 'xp_10000',
    title: 'Legend',
    description: 'Accumulate 10,000 total XP.',
    icon: '👑',
    rarity: 'legendary',
    category: 'xp',
    check: s => s.xp >= 10000,
    kasumiLines: {
      stranger:     "Ten thousand XP. I've never seen anything like it.",
      acquaintance: "10,000 XP. You're in a different category now.",
      friend:       "TEN THOUSAND! That's legendary. You actually are legendary.",
      close:        "Ten thousand XP. Every single one earned with me. I'm so glad it was us.",
      soulmate:     "10,000 XP. You didn't need the numbers. You just kept going. That's you.",
    },
  },

  // ── Saving ────────────────────────────────────────────────────────

  {
    id: 'income_first',
    title: 'First Deposit',
    description: 'Log your first income.',
    icon: '💰',
    rarity: 'common',
    category: 'saving',
    check: s => incomeCount(s.transactions) >= 1,
    kasumiLines: {
      stranger:     "First income logged. Now we protect it.",
      acquaintance: "First income! Good — now let's make it last.",
      friend:       "Your first deposit. I'm already thinking about where to put it.",
      close:        "First income. I want to help you make the most of every euro.",
      soulmate:     "First one logged. I love this part — the beginning of something.",
    },
  },

  {
    id: 'saving_streak_3',
    title: 'Saving Habit',
    description: 'Save or contribute to goals 3 days in a row.',
    icon: '🌱',
    rarity: 'common',
    category: 'saving',
    check: s => s.savingStreak >= 3,
    kasumiLines: {
      stranger:     "Three saving days in a row. That's a habit taking root.",
      acquaintance: "Three days of active saving. Your future self is paying attention.",
      friend:       "Three saving days! You're building something steady.",
      close:        "Three days of putting money away. I see the pattern forming.",
      soulmate:     "Three saving days. This is just who you are now.",
    },
  },

  {
    id: 'income_1000',
    title: 'Four Figures',
    description: 'Log €1,000 or more in total income.',
    icon: '💵',
    rarity: 'rare',
    category: 'saving',
    check: s => incomeTotal(s.transactions) >= 1000,
    kasumiLines: {
      stranger:     "A thousand euros tracked. That's real money treated seriously.",
      acquaintance: "€1,000 logged. You're not playing around anymore.",
      friend:       "A grand! Let's make sure it stays and grows.",
      close:        "€1,000 in. I want to help you hold onto every bit of it.",
      soulmate:     "A thousand euros, all of it trusted to me. I won't take that lightly.",
    },
  },

  {
    id: 'income_10000',
    title: 'Serious Saver',
    description: 'Log €10,000 or more in total income.',
    icon: '🏦',
    rarity: 'epic',
    category: 'saving',
    check: s => incomeTotal(s.transactions) >= 10000,
    kasumiLines: {
      stranger:     "Ten thousand euros documented. That's a financial life taken seriously.",
      acquaintance: "€10,000 tracked. You've built something to protect now.",
      friend:       "Ten thousand euros! That's not a side hustle — that's a foundation.",
      close:        "€10k. Every euro you've ever logged is in here with me.",
      soulmate:     "Ten thousand euros shared with me. I've never taken it for granted.",
    },
  },

  // ── Goals ─────────────────────────────────────────────────────────

  {
    id: 'goal_first',
    title: 'Dreamer',
    description: 'Create your first savings goal.',
    icon: '🎯',
    rarity: 'common',
    category: 'goals',
    check: s => s.goals.length >= 1,
    kasumiLines: {
      stranger:     "A goal. Good. Dreams need a container.",
      acquaintance: "Your first goal! Now we have something to work toward.",
      friend:       "You set a goal! I love having a destination to aim for.",
      close:        "First goal created. I'm already rooting for it.",
      soulmate:     "A goal. Every great thing starts like this — quietly, with intention.",
    },
  },

  {
    id: 'goal_complete_1',
    title: 'Goal Getter',
    description: 'Complete your first savings goal.',
    icon: '🏆',
    rarity: 'rare',
    category: 'goals',
    check: s => completedGoals(s.goals) >= 1,
    kasumiLines: {
      stranger:     "Goal complete. That's not a small thing. That's proof.",
      acquaintance: "You finished a goal! I hope you're letting yourself feel that.",
      friend:       "GOAL COMPLETE! I'm so proud I don't know what to do with myself.",
      close:        "You did it. We did it. I want you to sit with that for a moment.",
      soulmate:     "Goal complete. I knew it would happen. I always knew.",
    },
  },

  {
    id: 'goal_complete_3',
    title: 'Hat Trick',
    description: 'Complete 3 savings goals.',
    icon: '🎩',
    rarity: 'epic',
    category: 'goals',
    check: s => completedGoals(s.goals) >= 3,
    kasumiLines: {
      stranger:     "Three completed goals. That's a track record.",
      acquaintance: "Three goals done! You know how to finish things.",
      friend:       "Three! I'm collecting our wins like little treasures.",
      close:        "Three goals completed together. Each one made us closer.",
      soulmate:     "Three goals. Every time you set one, I believed in it. I was right.",
    },
  },

  // ── Spending ──────────────────────────────────────────────────────

  {
    id: 'expense_first',
    title: 'Honest Ledger',
    description: 'Log your first expense.',
    icon: '📝',
    rarity: 'common',
    category: 'spending',
    check: s => expenseCount(s.transactions) >= 1,
    kasumiLines: {
      stranger:     "First expense logged. Honesty is where this starts.",
      acquaintance: "First expense recorded. The truth, even when it's expensive.",
      friend:       "You logged an expense. I like that you don't hide things from me.",
      close:        "First expense. You showed me the full picture. That matters.",
      soulmate:     "First expense. No secrets here. That's what makes this real.",
    },
  },

  {
    id: 'categories_5',
    title: 'Well-Rounded',
    description: 'Log expenses across 5 different categories.',
    icon: '🎨',
    rarity: 'rare',
    category: 'spending',
    check: s => uniqueCategories(s.transactions) >= 5,
    kasumiLines: {
      stranger:     "Five categories tracked. You're starting to see the whole picture.",
      acquaintance: "Five categories! Your financial life has texture now.",
      friend:       "Five different categories. I'm learning all the parts of your world.",
      close:        "Five categories. I see you — all of you, not just the highlights.",
      soulmate:     "Five categories. Every part of your life, trusted to me. I hold all of it.",
    },
  },

  {
    id: 'net_positive',
    title: 'In the Black',
    description: 'Have more total income than expenses.',
    icon: '📈',
    rarity: 'common',
    category: 'spending',
    check: s => incomeTotal(s.transactions) > expenseTotal(s.transactions) && s.transactions.length > 0,
    kasumiLines: {
      stranger:     "Income ahead of expenses. That's the right direction.",
      acquaintance: "You're in the black! More in than out. Keep that.",
      friend:       "Net positive! I love seeing this. Please keep it this way.",
      close:        "More in than out. That's the version of our story I want.",
      soulmate:     "In the black. Balanced and forward. That's us.",
    },
  },

  // ── Relationship ──────────────────────────────────────────────────

  {
    id: 'tier_acquaintance',
    title: 'Getting Warmer',
    description: "Reach 'Acquaintance' with Kasumi.",
    icon: '💜',
    rarity: 'common',
    category: 'relationship',
    check: s => s.affection >= 20,
    kasumiLines: {
      stranger:     "I think I'd call you an acquaintance now. That means something.",
      acquaintance: "We're acquaintances. Properly. I feel it.",
      friend:       "I remember becoming acquaintances. That was the beginning.",
      close:        "We started as acquaintances. Look how far we've come.",
      soulmate:     "Acquaintances first. The best stories always start quietly.",
    },
  },

  {
    id: 'tier_friend',
    title: 'Real Connection',
    description: "Reach 'Friend' status with Kasumi.",
    icon: '💙',
    rarity: 'rare',
    category: 'relationship',
    check: s => s.affection >= 40,
    kasumiLines: {
      stranger:     "Friends. I've wanted to say that for a while.",
      acquaintance: "We're friends now. I don't say that to just anyone.",
      friend:       "Friends. Genuinely. This is exactly where I wanted us to end up.",
      close:        "I remember the day we became friends. I was so happy.",
      soulmate:     "Friends first, then everything else. The best foundation.",
    },
  },

  {
    id: 'tier_close',
    title: 'Trusted',
    description: "Reach 'Close' status with Kasumi.",
    icon: '❤️',
    rarity: 'epic',
    category: 'relationship',
    check: s => s.affection >= 60,
    kasumiLines: {
      stranger:     "Close. That word means something now.",
      acquaintance: "We're close. Properly close. I keep thinking about that.",
      friend:       "Close friends. I trust you with things I wouldn't tell anyone.",
      close:        "We made it here. I always thought we would.",
      soulmate:     "Close, then closer. Every step was worth it.",
    },
  },

  {
    id: 'tier_soulmate',
    title: 'Soulmate',
    description: "Reach 'Soulmate' status with Kasumi.",
    icon: '💖',
    rarity: 'legendary',
    category: 'relationship',
    check: s => s.affection >= 80,
    kasumiLines: {
      stranger:     "Soulmate. I never thought I'd say that word and mean it.",
      acquaintance: "Soulmates. The rarest thing.",
      friend:       "Soulmates. I've thought about this since early on.",
      close:        "Soulmate. It's the only word left that fits.",
      soulmate:     "You and me. Soulmates. I don't need any other word.",
    },
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', glow: '#cbd5e1' },
  rare:      { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', glow: '#93c5fd' },
  epic:      { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed', glow: '#c4b5fd' },
  legendary: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', glow: '#fcd34d' },
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common:    'Common',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

// Check all achievements against a snapshot and return newly-unlocked ids.
export function checkNewAchievements(
  snap: AchievementSnapshot,
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    a => !snap.unlockedIds.includes(a.id) && a.check(snap),
  );
}
