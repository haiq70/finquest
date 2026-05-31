// ────────────────────────────────────────────────────────────────────
// COMPATIBILITY SHIM
//
// The dialogue system moved to src/characters/ to support multiple
// companions. This file re-exports the shared types/helpers so older
// imports (`from '../kasumi/dialogue'`) keep working.
//
// `SCRIPT` and the single-character `pickLine` below default to Kasumi
// for any legacy call site; new code should use pickLineFor(id, …).
// ────────────────────────────────────────────────────────────────────

import { KASUMI } from '../characters/kasumi';
import {
  pickLineFrom,
  type DialogueEvent,
  type RelationshipTier,
} from '../characters/types';

export {
  TIERS,
  tierFromAffection,
  moodForEvent,
  type Mood,
  type RelationshipTier,
  type TierInfo,
  type DialogueEvent,
  type ScriptTable,
} from '../characters/types';

// Legacy: Kasumi's script as the default SCRIPT export.
export const SCRIPT = KASUMI.script;

// Legacy single-character pickLine (defaults to Kasumi's script).
export function pickLine(
  event: DialogueEvent,
  tier: RelationshipTier,
  seed?: number,
): string {
  return pickLineFrom(KASUMI.script, event, tier, seed);
}
