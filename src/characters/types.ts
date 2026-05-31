// ────────────────────────────────────────────────────────────────────
// Shared types for the companion-character system.
//
// The app supports multiple companions (Kasumi, Mira, …). Each is a
// CharacterDef: identity + art + a dialogue SCRIPT. All the *mechanics*
// (affection, tiers, moods, events) are shared and live here; only the
// *content* differs per character.
// ────────────────────────────────────────────────────────────────────

export type Mood = 'neutral' | 'happy' | 'sad';

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
  | 'net_negative';     // persistent: expenses > income overall

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
  /** If true, the player starts with this character unlocked. */
  unlockedByDefault: boolean;
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
