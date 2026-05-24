// ────────────────────────────────────────────────────────────────────
// Coin (FC — FinCoin) earning rules.
//
// Coins are a separate in-app currency from XP.
// XP drives levels and the relationship arc.
// Coins are purely for the shop — so there's no pay-to-win tension.
//
// Earning rates are intentionally generous early (feels rewarding)
// and taper off so the shop remains aspirational.
// ────────────────────────────────────────────────────────────────────

export const COINS_PER_EXPENSE_LOG  = 5;   // every expense logged earns a little
export const COINS_PER_INCOME_BASE  = 15;  // base for logging income
export const COINS_PER_GOAL_CONTRIB = 20;  // per goal contribution action
export const COINS_PER_STREAK_DAY   = 10;  // bonus on each streak-day log
export const COINS_STREAK_MILESTONE = 50;  // extra at streak milestones (3,7,30…)
export const COINS_GOAL_COMPLETED   = 100; // completing a goal
export const COINS_LEVEL_UP         = 75;  // leveling up

// Anti-exploit: only the first N transactions each day earn coins.
// Beyond this, transactions still log normally (XP, streaks, achievements
// all unaffected) but grant zero coins — so users can't farm currency by
// spamming tiny entries.
export const DAILY_COIN_TX_CAP = 3;

export interface CoinAward {
  amount: number;
  reason: string;  // short label for toast
}

/**
 * Coins awarded when logging a transaction.
 * Returns the total award and a human-readable reason string.
 */
export function coinsForTransaction(
  type: 'income' | 'expense',
  streakDay: boolean,        // true if this is a new streak day (not same day repeat)
  streakMilestone: boolean,  // true if streak just hit a milestone
  leveledUp: boolean,
  coinBoostActive: boolean,
  coinBoostMultiplier: number,
): CoinAward {
  let base = type === 'income' ? COINS_PER_INCOME_BASE : COINS_PER_EXPENSE_LOG;
  const reasons: string[] = [type === 'income' ? 'income logged' : 'expense logged'];

  if (streakDay) {
    base += COINS_PER_STREAK_DAY;
    reasons.push('streak day');
  }
  if (streakMilestone) {
    base += COINS_STREAK_MILESTONE;
    reasons.push('streak milestone!');
  }
  if (leveledUp) {
    base += COINS_LEVEL_UP;
    reasons.push('level up!');
  }

  const multiplier = coinBoostActive ? 1 + coinBoostMultiplier : 1;
  const total = Math.round(base * multiplier);
  const label = coinBoostActive
    ? `+${total} FC (${Math.round(multiplier * 100)}% boost)`
    : `+${total} FC`;

  return { amount: total, reason: label };
}

export function coinsForGoalContrib(
  justCompleted: boolean,
  coinBoostActive: boolean,
  coinBoostMultiplier: number,
): CoinAward {
  const base = justCompleted
    ? COINS_PER_GOAL_CONTRIB + COINS_GOAL_COMPLETED
    : COINS_PER_GOAL_CONTRIB;
  const multiplier = coinBoostActive ? 1 + coinBoostMultiplier : 1;
  const total = Math.round(base * multiplier);
  const reason = justCompleted ? `+${total} FC · goal complete!` : `+${total} FC`;
  return { amount: total, reason };
}

// ── Achievement coin rewards ────────────────────────────────────────
// Earning an achievement grants a one-time coin payout scaled by rarity.
// These are NOT subject to the daily transaction cap or coin boosts —
// they're milestone rewards, earned once each, so they can't be farmed.
export const ACHIEVEMENT_COIN_REWARD: Record<string, number> = {
  common:    50,
  rare:      150,
  epic:      350,
  legendary: 750,
};

export function coinsForAchievement(rarity: string): CoinAward {
  const amount = ACHIEVEMENT_COIN_REWARD[rarity] ?? ACHIEVEMENT_COIN_REWARD.common;
  return { amount, reason: `+${amount} FC · achievement!` };
}
