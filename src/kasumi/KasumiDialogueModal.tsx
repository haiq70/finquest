import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, Modal,
  SafeAreaView, Dimensions,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, FontWeight, Radius, Spacing } from '../theme';
import {
  pickLine,
  tierFromAffection,
  type Mood,
} from '../kasumi/dialogue';
import { AFFECTION_MAX } from '../kasumi/affection';

const FACES: Record<Mood, any> = {
  neutral: require('../../assets/images/kasumi/neutral.png'),
  happy:   require('../../assets/images/kasumi/happy.jpeg'),
  sad:     require('../../assets/images/kasumi/sad.jpeg'),
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface KasumiDialogueModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTransaction?: () => void;
  onOpenGoals?: () => void;
}

interface DialogueChoice {
  label: string;
  onPress: () => void;
}

// Build the sequence of lines for a single "visit" to Kasumi.
// We always start with whatever she's currently reacting to (if any),
// then layer on tier-appropriate idle small-talk so the conversation
// feels like more than one line.
function buildScript(
  primaryLine: string,
  tierKey: ReturnType<typeof tierFromAffection>['key'],
): string[] {
  const lines: string[] = [];
  if (primaryLine) lines.push(primaryLine);
  // Add two extra ambient lines from idle pool so there's more to read.
  const extras = new Set<string>();
  for (let i = 0; i < 4 && extras.size < 2; i++) {
    const l = pickLine('idle', tierKey);
    if (l && l !== primaryLine) extras.add(l);
  }
  return [...lines, ...extras];
}

export function KasumiDialogueModal({
  visible, onClose, onAddTransaction, onOpenGoals,
}: KasumiDialogueModalProps) {
  const affection   = useStore(s => s.affection);
  const currentMood = useStore(s => s.currentMood);
  const currentLine = useStore(s => s.currentLine);
  const refreshIdle = useStore(s => s.refreshIdleLine);

  const tier = useMemo(() => tierFromAffection(affection), [affection]);

  const [script, setScript] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  // Rebuild the script every time the modal opens so each visit
  // feels fresh (random pool draws). Reset to first line.
  useEffect(() => {
    if (visible) {
      setScript(buildScript(currentLine, tier.key));
      setIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onScreen = visible && script.length > 0;
  const atEnd    = idx >= script.length - 1;
  const line     = script[idx] ?? '';

  function advance() {
    if (atEnd) return;
    setIdx(i => i + 1);
  }

  function dismiss() {
    refreshIdle();
    onClose();
  }

  const choices: DialogueChoice[] = atEnd
    ? [
        { label: '＋  Log a transaction', onPress: () => { dismiss(); onAddTransaction?.(); } },
        { label: '🎯  Open goals',         onPress: () => { dismiss(); onOpenGoals?.(); } },
        { label: 'See you later',          onPress: dismiss },
      ]
    : [];

  const pct = Math.round((affection / AFFECTION_MAX) * 100);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safe}>
        {/* Background gradient-ish stack — solid layers since we don't have a gradient lib */}
        <View style={styles.bgBase} />
        <View style={styles.bgGlow} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Text style={styles.name}>Kasumi</Text>
            <Text style={[styles.tierLabel, { color: tier.accent }]}>{tier.label}</Text>
          </View>
          <Pressable onPress={dismiss} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {/* Affection bar under top */}
        <View style={styles.affRow}>
          <View style={styles.affTrack}>
            <View style={[styles.affFill, { width: `${pct}%` as any, backgroundColor: tier.accent }]} />
          </View>
          <Text style={styles.affText}>{affection} / {AFFECTION_MAX}</Text>
        </View>

        {/* Character portrait — large, central */}
        <Pressable style={styles.portraitWrap} onPress={advance}>
          <Image
            source={FACES[onScreen ? currentMood : 'neutral']}
            style={styles.portrait}
            resizeMode="cover"
          />
        </Pressable>

        {/* Dialogue box */}
        <View style={styles.dialogueWrap}>
          <View style={styles.dialogueBox}>
            <View style={styles.dialogueHeader}>
              <Text style={styles.dialogueSpeaker}>Kasumi</Text>
              {!atEnd && <Text style={styles.dialogueHint}>tap to continue ▾</Text>}
            </View>
            <Pressable onPress={advance} style={styles.dialogueBody}>
              <Text style={styles.dialogueText}>{line}</Text>
            </Pressable>

            {atEnd && (
              <View style={styles.choices}>
                {choices.map((c, i) => (
                  <Pressable
                    key={i}
                    onPress={c.onPress}
                    style={({ pressed }) => [
                      styles.choice,
                      i === 0 && styles.choicePrimary,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.choiceText, i === 0 && styles.choiceTextPrimary]}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a0a2e' },

  // Layered background — purple "night" with a soft glow behind Kasumi.
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a0a2e',
  },
  bgGlow: {
    position: 'absolute',
    top: SCREEN_H * 0.15,
    left: SCREEN_W * 0.5 - 180,
    width: 360, height: 360,
    borderRadius: 180,
    backgroundColor: '#7c3aed',
    opacity: 0.25,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  topLeft: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  name:    { color: '#fff', fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: -0.3 },
  tierLabel: { fontSize: 12, fontWeight: FontWeight.semibold, letterSpacing: 0.5, textTransform: 'uppercase' },
  close:   { color: 'rgba(255,255,255,0.7)', fontSize: 22, paddingHorizontal: 6 },

  affRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  affTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.full, overflow: 'hidden' },
  affFill:  { height: '100%', borderRadius: Radius.full },
  affText:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontVariant: ['tabular-nums'] },

  portraitWrap: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingTop: Spacing.sm,
  },
  portrait: {
    width: Math.min(SCREEN_W * 0.85, 360),
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: '#2a1a4e',
  },

  dialogueWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dialogueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 6,
  },
  dialogueSpeaker: { fontSize: 13, fontWeight: FontWeight.bold, color: '#7c3aed', letterSpacing: 0.5, textTransform: 'uppercase' },
  dialogueHint:    { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },
  dialogueBody:    { paddingVertical: 4 },
  dialogueText:    { fontSize: 16, color: Colors.textPrimary, lineHeight: 23 },

  choices: { marginTop: Spacing.lg, gap: Spacing.sm },
  choice: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e9e3ff',
    backgroundColor: '#faf8ff',
    alignItems: 'center',
  },
  choicePrimary: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  choiceText:        { fontSize: 14, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  choiceTextPrimary: { color: '#fff' },
});
