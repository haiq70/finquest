import type { CharacterDef, CharacterId, DialogueEvent, Mood, RelationshipTier } from './types';
import { pickLineFrom } from './types';
import { KASUMI } from './kasumi';
import { MIRA } from './mira';

export * from './types';

// Registry of all companions, in display order.
export const CHARACTERS: CharacterDef[] = [KASUMI, MIRA];

export const CHARACTERS_BY_ID: Record<CharacterId, CharacterDef> = {
  kasumi: KASUMI,
  mira: MIRA,
};

export const DEFAULT_CHARACTER_ID: CharacterId = 'kasumi';

export function getCharacter(id: CharacterId): CharacterDef {
  return CHARACTERS_BY_ID[id] ?? KASUMI;
}

/** Portraits for a character keyed by mood. */
export function portraitsFor(id: CharacterId): Record<Mood, any> {
  return getCharacter(id).portraits;
}

/** Pick a dialogue line for a given character + event + tier. */
export function pickLineFor(
  id: CharacterId,
  event: DialogueEvent,
  tier: RelationshipTier,
  seed?: number,
): string {
  return pickLineFrom(getCharacter(id).script, event, tier, seed);
}
