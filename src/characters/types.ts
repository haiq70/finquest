// ────────────────────────────────────────────────────────────────────
// Shared types for the companion-character system.
//
// The app supports multiple companions (Kasumi, Mira, …). Each is a
// CharacterDef: identity + art + a dialogue SCRIPT. All the *mechanics*
// (affection, tiers, moods, events) are shared and live here; only the
// *content* differs per character.
// ────────────────────────────────────────────────────────────────────

export type Mood = 'neutral' | 'happy' | 'sad' | 'surprised';

export type RelationshipTier =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close'
  | 'soulmate';

export interface TierInfo {
  key: RelationshipTier;
  label: string;
  min: number;   // inclusive
  max: number;   // inclusive
  accent: string;
}

export const TIERS: TierInfo[] = [
  { key: 'stranger',     label: 'Stranger',     min: 0,  max: 19,  accent: '#94a3b8' },
  { key: 'acquaintance', label: 'Acquaintance', min: 20, max: 39,  accent: '#a78bfa' },
  { key: 'friend',       label: 'Friend',       min: 40, max: 59,  accent: '#8b5cf6' },
  { key: 'close',        label: 'Close',        min: 60, max: 79,  accent: '#7c3aed' },
  { key: 'soulmate',     label: 'Soulmate',     min: 80, max: 100, accent: '#6d28d9' },
];

export function tierFromAffection(affection: number): TierInfo {
  const a = Math.max(0, Math.min(100, affection));
  return TIERS.find(t => a >= t.min && a <= t.max) ?? TIERS[0];
}

// ── Event taxonomy ──────────────────────────────────────────────────
export type DialogueEvent =
  | 'idle'              // ambient line shown on home screen
  | 'income'            // logged income
  | 'small_expense'     // expense ≤ small threshold
  | 'big_expense'       // expense > big threshold
  | 'goal_contribution' // added to a goal
  | 'goal_completed'    // a goal just hit 100%
  | 'level_up'          // crossed an XP level
  | 'streak_milestone'  // hit a 7/14/30 day streak
  | 'streak_broken'     // streak reset to 1 after >1 day gap
  | 'first_meeting'     // affection still 0 and never spoken to
  | 'tier_up'           // just moved into a new tier
  | 'net_negative'      // persistent: expenses > income overall
  | 'reaction';         // transient line set directly (shop buy / item use)

export type ScriptTable = Record<DialogueEvent, Record<RelationshipTier, string[]>>;

export type CharacterId = 'kasumi' | 'mira';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  kanji?: string;
  /** One-line personality blurb for the character-select screen. */
  blurb: string;
  /** Accent color used for this character's UI touches. */
  accent: string;
  /** Portrait art keyed by mood. */
  portraits: Record<Mood, any>;
  /** Full dialogue script (event × tier). */
  script: ScriptTable;
  /** In-voice one-liners reacting to a shop purchase. */
  purchaseLines: string[];
  /** In-voice one-liners reacting to activating/using a consumable. */
  useLines: string[];
  /** Interactive choice prompts shown on income (random) and tier-up. */
  choicePrompts: ChoicePrompt[];
  /** If true, the player starts with this character unlocked. */
  unlockedByDefault: boolean;
}

// ── Interactive choice prompts ──────────────────────────────────────
// A small "dialogue tree" beat: the character says something, the player
// picks one of several replies, and the reply grants a hidden reward
// (affection and/or coins — which can be negative for affection).

export interface ChoiceOption {
  /** The reply text shown on the button. */
  label: string;
  /** Affection change (can be negative; keep losses small, e.g. -3). */
  affection: number;
  /** Coin (FC) reward. Usually 0 or positive. */
  coins: number;
  /** The character's reaction line after this choice is picked. */
  reaction: string;
}

export interface ChoicePrompt {
  /** Unique id (for not repeating the same prompt back-to-back). */
  id: string;
  /** Optional: only show at/after this tier. Omit = any tier. */
  minTier?: RelationshipTier;
  /** The setup line the character opens with. */
  prompt: string;
  /** 2-3 reply options. */
  options: ChoiceOption[];
}

// ── Mood selection (shared across characters) ───────────────────────
export function moodForEvent(event: DialogueEvent): Mood {
  switch (event) {
    case 'income':
    case 'goal_contribution':
    case 'goal_completed':
    case 'level_up':
    case 'streak_milestone':
    case 'tier_up':
      return 'happy';
    case 'big_expense':
    case 'streak_broken':
      return 'sad';
    case 'small_expense':
    case 'idle':
    case 'first_meeting':
    default:
      return 'neutral';
  }
}

// Pick a line from a script for a given event + tier, with graceful
// fallback to the nearest non-empty tier.
export function pickLineFrom(
  script: ScriptTable,
  event: DialogueEvent,
  tier: RelationshipTier,
  seed?: number,
): string {
  const eventTable = script[event];
  if (!eventTable) return '';
  let pool = eventTable[tier];
  if (!pool || pool.length === 0) {
    const order: RelationshipTier[] = ['soulmate', 'close', 'friend', 'acquaintance', 'stranger'];
    const startIdx = order.indexOf(tier);
    for (let i = startIdx; i < order.length; i++) {
      const candidate = eventTable[order[i]];
      if (candidate && candidate.length > 0) {
        pool = candidate;
        break;
      }
    }
    if (!pool || pool.length === 0) return '';
  }
  const idx = seed === undefined
    ? Math.floor(Math.random() * pool.length)
    : seed % pool.length;
  return pool[idx];
}

// Tier ordering for gating (low → high).
const TIER_ORDER: RelationshipTier[] = ['stranger', 'acquaintance', 'friend', 'close', 'soulmate'];

export function tierAtLeast(tier: RelationshipTier, min: RelationshipTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min);
}

/**
 * Pick a choice prompt eligible at the given tier, avoiding `excludeId`
 * (the last-seen prompt) when possible. Returns null if none available.
 */
export function pickChoicePrompt(
  prompts: ChoicePrompt[],
  tier: RelationshipTier,
  excludeId?: string,
): ChoicePrompt | null {
  const eligible = prompts.filter(p => !p.minTier || tierAtLeast(tier, p.minTier));
  if (eligible.length === 0) return null;
  const pool = eligible.length > 1 && excludeId
    ? eligible.filter(p => p.id !== excludeId)
    : eligible;
  const finalPool = pool.length > 0 ? pool : eligible;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
