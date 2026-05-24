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

// ── Streak reward multiplier ─────────────────────────────────────────
// The longer the player's *activity* streak, the bigger the bonus on
// both XP and coins. Grows +STREAK_BONUS_PER_DAY each consecutive day,
// capped at STREAK_BONUS_MAX. Because it reads the live streak value,
// it automatically falls back to the day-1 rate the moment a streak
// breaks (streak resets to 1 → multiplier resets to the floor).
export const STREAK_BONUS_PER_DAY = 0.05;  // +5% per streak day
export const STREAK_BONUS_MAX     = 1.0;   // cap the bonus at +100% (i.e. 2× total)

/**
 * Returns the streak reward multiplier (>= 1.0).
 * Day 1 → 1.0×, day 2 → 1.05×, … capped at 2.0×.
 */
export function streakMultiplier(streak: number): number {
  const days = Math.max(0, streak - 1); // first day is the baseline (no bonus yet)
  const bonus = Math.min(STREAK_BONUS_MAX, days * STREAK_BONUS_PER_DAY);
  return 1 + bonus;
}

/** Human-readable label e.g. "1.25× streak" — only when above 1×. */
export function streakMultiplierLabel(streak: number): string | null {
  const m = streakMultiplier(streak);
  if (m <= 1) return null;
  return `${m.toFixed(2).replace(/\.?0+$/, '')}× streak`;
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
