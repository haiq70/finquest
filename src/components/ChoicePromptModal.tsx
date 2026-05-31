import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCharacter, type Mood } from '../characters';
import { useStore } from '../store/useStore';
import { playTap } from '../utils/sound';

// ────────────────────────────────────────────────────────────────────
// Interactive choice prompt. Appears on tier-up (always) and randomly on
// income. Shows the active character's setup line + reply options with
// HIDDEN rewards; after the player picks, reveals the reaction, the
// affection/coin change, and the matching sprite (happy gain / sad loss).
// Mounted once at the root so it can surface over any screen.
// ────────────────────────────────────────────────────────────────────

export function ChoicePromptModal() {
  const prompt        = useStore(s => s.pendingChoicePrompt);
  const result        = useStore(s => s.choiceResult);
  const activeCharId   = useStore(s => s.activeCharacterId);
  const currentMood    = useStore(s => s.currentMood);
  const resolve        = useStore(s => s.resolveChoicePrompt);
  const clearResult    = useStore(s => s.clearChoiceResult);

  // Local: which option was tapped (drives the two-phase view).
  const [picked, setPicked] = useState<number | null>(null);

  const char = getCharacter(activeCharId);
  const visible = !!prompt || !!result;

  // Phase 1: prompt + options. Phase 2: reaction + revealed reward.
  const showingResult = !prompt && !!result;

  const onPick = (i: number) => {
    playTap();
    setPicked(i);
    resolve(i);
  };

  const onDone = () => {
    playTap();
    clearResult();
    setPicked(null);
  };

  if (!visible) return <Modal visible={false} transparent />;

  // Portrait mood: while choosing, neutral; after, reflect the outcome.
  const mood: Mood = showingResult ? currentMood : 'neutral';

  const affDelta = result?.affection ?? 0;
  const coinDelta = result?.coins ?? 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={showingResult ? onDone : undefined}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.portraitWrap, { borderColor: char.accent }]}>
            <Image source={char.portraits[mood]} style={styles.portrait} resizeMode="cover" />
          </View>

          <Text style={[styles.speaker, { color: char.accent }]}>{char.name} ♡</Text>

          {!showingResult && prompt ? (
            <>
              <Text style={styles.prompt}>{prompt.prompt}</Text>
              <View style={styles.options}>
                {prompt.options.map((o, i) => (
                  <Pressable
                    key={i}
                    style={[styles.optionBtn, { borderColor: char.accent + '55' }]}
                    onPress={() => onPick(i)}
                    disabled={picked !== null}
                  >
                    <Text style={styles.optionText}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.reaction}>{result?.reaction}</Text>

              {/* Reward reveal */}
              <View style={styles.rewardRow}>
                {affDelta !== 0 && (
                  <View style={[
                    styles.rewardChip,
                    { backgroundColor: affDelta > 0 ? '#f3e8ff' : '#fee2e2' },
                  ]}>
                    <Text style={[
                      styles.rewardText,
                      { color: affDelta > 0 ? '#7c3aed' : '#dc2626' },
                    ]}>
                      {affDelta > 0 ? '♡ +' : '♡ '}{affDelta} affection
                    </Text>
                  </View>
                )}
                {coinDelta > 0 && (
                  <View style={[styles.rewardChip, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.rewardText, { color: '#b45309' }]}>+{coinDelta} FC</Text>
                  </View>
                )}
                {affDelta === 0 && coinDelta === 0 && (
                  <Text style={styles.neutralNote}>No change — just talk.</Text>
                )}
              </View>

              <Pressable style={[styles.doneBtn, { backgroundColor: char.accent }]} onPress={onDone}>
                <Text style={styles.doneText}>Continue</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(40,12,60,0.72)',
    alignItems: 'center', justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%', maxWidth: 390,
    backgroundColor: '#fdf9ff',
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#4c1d95', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 16,
  },
  portraitWrap: {
    width: 96, height: 124, borderRadius: 16, overflow: 'hidden',
    borderWidth: 3, marginBottom: 12, backgroundColor: '#eee',
  },
  portrait: { width: '100%', height: '100%' },
  speaker: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  prompt: { fontSize: 16, color: '#3b0764', lineHeight: 23, textAlign: 'center', marginBottom: 18, fontWeight: '500' },
  options: { width: '100%', gap: 10 },
  optionBtn: {
    width: '100%', paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.7)',
  },
  optionText: { fontSize: 14.5, color: '#3b0764', fontWeight: '600', textAlign: 'center' },

  reaction: { fontSize: 15.5, color: '#3b0764', lineHeight: 22, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  rewardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20, minHeight: 28 },
  rewardChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  rewardText: { fontSize: 13.5, fontWeight: '800' },
  neutralNote: { fontSize: 13, color: '#a78bfa', fontStyle: 'italic' },
  doneBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
