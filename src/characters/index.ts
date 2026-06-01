import type { CharacterDef, CharacterId, ChoicePrompt, DialogueEvent, Mood, RelationshipTier } from './types';
import { pickLineFrom, pickChoicePrompt } from './types';
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

/** Pick a random in-voice reaction line for a shop purchase. */
export function purchaseLineFor(id: CharacterId, seed?: number): string {
  const lines = getCharacter(id).purchaseLines;
  if (!lines || lines.length === 0) return '';
  const idx = seed === undefined
    ? Math.floor(Math.random() * lines.length)
    : seed % lines.length;
  return lines[idx];
}

/** Pick a random in-voice reaction line for using/activating an item. */
export function useLineFor(id: CharacterId, seed?: number): string {
  const lines = getCharacter(id).useLines;
  if (!lines || lines.length === 0) return '';
  const idx = seed === undefined
    ? Math.floor(Math.random() * lines.length)
    : seed % lines.length;
  return lines[idx];
}

/** Pick an eligible choice prompt for a character at a given tier. */
export function choicePromptFor(
  id: CharacterId,
  tier: RelationshipTier,
  excludeId?: string,
): ChoicePrompt | null {
  return pickChoicePrompt(getCharacter(id).choicePrompts, tier, excludeId);
}
