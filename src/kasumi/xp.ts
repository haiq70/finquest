// ────────────────────────────────────────────────────────────────────
// XP calculation rules.
//
// Design goals:
//   1. Expenses earn nothing (they're tracked, not rewarded).
//   2. Saving behaviors (income, goal contributions) earn XP, with
//      multipliers at amount thresholds.
//   3. Big multipliers gate behind a 3-day saving streak to prevent
//      a user from front-loading €500 on day one for free 3× XP.
// ────────────────────────────────────────────────────────────────────

export const BASE_XP_INCOME = 20;
export const BASE_XP_GOAL_CONTRIB = 30;

// Streak required to unlock multipliers above 1.0×.
export const MULTIPLIER_STREAK_GATE = 3;

// Amount thresholds (€) → multiplier.
// Each tier requires more discipline (= more streak days) to access.
export interface MultiplierTier {
  minAmount: number;
  multiplier: number;
  label: string;
}

export const MULTIPLIER_TIERS: MultiplierTier[] = [
  { minAmount: 500, multiplier: 3.0, label: '3× MEGA' },
  { minAmount: 300, multiplier: 2.0, label: '2× BIG' },
  { minAmount: 100, multiplier: 1.5, label: '1.5×' },
  { minAmount: 0,   multiplier: 1.0, label: '1×' },
];

export interface XpAward {
  amount: number;        // final XP awarded
  multiplier: number;    // multiplier actually applied
  multiplierLocked: boolean; // true if the tier would have given more, but streak was too short
  tierLabel: string;     // for UI/feedback
}

/**
 * Calculate XP for a saving action (income or goal contribution).
 *
 * @param baseXp         starting XP before multipliers
 * @param amount         the € amount of the action
 * @param savingStreak   current consecutive-saving-days streak
 */
export function calcSavingXp(
  baseXp: number,
  amount: number,
  savingStreak: number,
): XpAward {
  // Pick the highest tier whose threshold the amount clears.
  const tier = MULTIPLIER_TIERS.find(t => amount >= t.minAmount)!;

  // If the user hasn't earned the streak yet, clamp the multiplier to 1×.
  const streakUnlocked = savingStreak >= MULTIPLIER_STREAK_GATE;
  const effectiveMultiplier = streakUnlocked ? tier.multiplier : 1.0;
  const multiplierLocked = !streakUnlocked && tier.multiplier > 1.0;

  return {
    amount: Math.round(baseXp * effectiveMultiplier),
    multiplier: effectiveMultiplier,
    multiplierLocked,
    tierLabel: streakUnlocked ? tier.label : '1× (streak locked)',
  };
}
