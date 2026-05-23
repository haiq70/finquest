// ────────────────────────────────────────────────────────────────────
// Affection-delta math.
//
// All gamification "rewards" route through here so the balance can be
// tuned in one place rather than scattered across the store.
// ────────────────────────────────────────────────────────────────────

import type { DialogueEvent } from './dialogue';

// Threshold below which an expense is considered "small" (€).
// Tunable — eventually this should be a percentage of monthly income,
// but a flat threshold is fine for the prototype.
export const BIG_EXPENSE_THRESHOLD = 50;

// Streaks worth a milestone reaction.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export const AFFECTION_MAX = 100;
export const AFFECTION_MIN = 0;

export interface MoodEvent {
  event: DialogueEvent;
  affectionDelta: number;
  // How long to hold the reaction face before relaxing back to neutral (ms).
  durationMs: number;
}

export function moodEventForIncome(amount: number): MoodEvent {
  // Bigger income = slightly bigger bump, capped so a single payday
  // doesn't trivialize the relationship arc.
  const bump = Math.min(5, 2 + Math.floor(amount / 500));
  return { event: 'income', affectionDelta: bump, durationMs: 4000 };
}

export function moodEventForExpense(amount: number): MoodEvent {
  if (amount > BIG_EXPENSE_THRESHOLD) {
    return { event: 'big_expense', affectionDelta: -4, durationMs: 4500 };
  }
  return { event: 'small_expense', affectionDelta: -1, durationMs: 2500 };
}

export function moodEventForGoalContribution(amount: number): MoodEvent {
  const bump = Math.min(8, 3 + Math.floor(amount / 100));
  return { event: 'goal_contribution', affectionDelta: bump, durationMs: 4000 };
}

export const MOOD_EVENT_GOAL_COMPLETED: MoodEvent = {
  event: 'goal_completed', affectionDelta: 15, durationMs: 6000,
};

export const MOOD_EVENT_LEVEL_UP: MoodEvent = {
  event: 'level_up', affectionDelta: 5, durationMs: 5000,
};

export const MOOD_EVENT_STREAK_MILESTONE: MoodEvent = {
  event: 'streak_milestone', affectionDelta: 8, durationMs: 5000,
};

export const MOOD_EVENT_STREAK_BROKEN: MoodEvent = {
  event: 'streak_broken', affectionDelta: -2, durationMs: 4000,
};

export const MOOD_EVENT_TIER_UP: MoodEvent = {
  event: 'tier_up', affectionDelta: 0, durationMs: 6000,
};

export function clampAffection(v: number): number {
  return Math.max(AFFECTION_MIN, Math.min(AFFECTION_MAX, v));
}
