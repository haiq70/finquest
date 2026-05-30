import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, Modal,
  SafeAreaView, Dimensions,
} from 'react-native';
import { useStore } from '../store/useStore';
import { playTap } from '../utils/sound';
import { FontWeight, Radius, Spacing } from '../theme';
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

// Same palette as the home screen restyle, kept local for autonomy.
const PALETTE = {
  bg:           '#faf5ff',
  bgAccent:     '#fce7f3',
  cardBorder:   '#ede9fe',
  textPrimary:  '#3b0764',
  textSecondary:'#7e22ce',
  textMuted:    '#a78bfa',
  accent:       '#a855f7',
  accentDeep:   '#7c3aed',
  pink:         '#ec4899',
  pinkDeep:     '#be185d',
  concernBg:    '#fff1f2',
  concernBorder:'#fbcfe8',
};

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

// Build the sequence of lines for a single visit. Always starts with
// whatever Kasumi is currently reacting to, then layers idle small-talk
// so the conversation feels like more than one beat.
function buildScript(
  primaryLine: string,
  tierKey: ReturnType<typeof tierFromAffection>['key'],
  extras = 2,
): string[] {
  const lines: string[] = [];
  if (primaryLine) lines.push(primaryLine);
  const seen = new Set<string>([primaryLine]);
  for (let i = 0; i < 6 && lines.length < extras + 1; i++) {
    const l = pickLine('idle', tierKey);
    if (l && !seen.has(l)) {
      lines.push(l);
      seen.add(l);
    }
  }
  return lines;
}

export function KasumiDialogueModal({
  visible, onClose, onAddTransaction, onOpenGoals,
}: KasumiDialogueModalProps) {
  const affection      = useStore(s => s.affection);
  const currentMood    = useStore(s => s.currentMood);
  const currentLine    = useStore(s => s.currentLine);
  const refreshIdle    = useStore(s => s.refreshIdleLine);
  const isNetNegative  = useStore(s => s.isNetNegative);

  const tier = useMemo(() => tierFromAffection(affection), [affection]);
  const netNeg = isNetNegative();

  // Override face + script when she's stuck in concerned mode.
  const displayMood: Mood = netNeg ? 'sad' : currentMood;

  const [script, setScript] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (netNeg) {
      // Show two concerned lines — feels heavier than one, fits the mood.
      const a = pickLine('net_negative', tier.key);
      const b = pickLine('net_negative', tier.key);
      setScript(a === b ? [a] : [a, b]);
    } else {
      setScript(buildScript(currentLine, tier.key));
    }
    setIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onScreen = visible && script.length > 0;
  const atEnd    = idx >= script.length - 1;
  const line     = script[idx] ?? '';

  function advance() {
    if (atEnd) return;
    playTap();
    setIdx(i => i + 1);
  }

  function dismiss() {
    refreshIdle();
    onClose();
  }

  // Choices change when she's worried — emphasize the corrective action.
  const choices: DialogueChoice[] = !atEnd ? [] : netNeg
    ? [
        { label: '＋  Log some income',  onPress: () => { dismiss(); onAddTransaction?.(); } },
        { label: '🎯  Review my goals', onPress: () => { dismiss(); onOpenGoals?.(); } },
        { label: 'I\'ll come back',     onPress: dismiss },
      ]
    : [
        { label: '＋  Log a transaction', onPress: () => { dismiss(); onAddTransaction?.(); } },
        { label: '🎯  Open goals',         onPress: () => { dismiss(); onOpenGoals?.(); } },
        { label: 'See you later',          onPress: dismiss },
      ];

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
        {/* Layered pastel background */}
        <View style={styles.bgBase} />
        <View style={styles.bgGlowPink} pointerEvents="none" />
        <View style={styles.bgGlowPurple} pointerEvents="none" />

        {/* Decorative sparkles */}
        <Text style={[styles.sparkle, { top: 80, left: 24, fontSize: 18 }]}>✦</Text>
        <Text style={[styles.sparkle, { top: 140, right: 38, fontSize: 14, opacity: 0.6 }]}>✧</Text>
        <Text style={[styles.sparkle, { top: 220, left: 36, fontSize: 12, opacity: 0.5 }]}>✦</Text>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Text style={styles.name}>Kasumi <Text style={styles.heart}>♡</Text></Text>
            <View style={[styles.tierPill, { backgroundColor: tier.accent + '22', borderColor: tier.accent + '88' }]}>
              <Text style={[styles.tierText, { color: tier.accent }]}>{tier.label}</Text>
            </View>
          </View>
          <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {/* Affection bar */}
        <View style={styles.affRow}>
          <View style={styles.affTrack}>
            <View style={[styles.affFill, { width: `${pct}%` as any, backgroundColor: tier.accent }]} />
          </View>
          <Text style={styles.affText}>{affection} / {AFFECTION_MAX}</Text>
        </View>

        {/* Portrait — large, central, framed */}
        <Pressable style={styles.portraitWrap} onPress={advance}>
          <View style={[styles.portraitGlow, netNeg && { backgroundColor: PALETTE.pink + '30' }]} />
          <View style={[styles.portraitFrame, { borderColor: netNeg ? PALETTE.pink + '55' : tier.accent + '55' }]}>
            <Image
              source={FACES[onScreen ? displayMood : 'neutral']}
              style={styles.portrait}
              resizeMode="cover"
            />
          </View>
        </Pressable>

        {/* Dialogue box */}
        <View style={styles.dialogueWrap}>
          <View style={[styles.dialogueBox, netNeg && styles.dialogueBoxConcerned]}>
            <View style={styles.dialogueHeader}>
              <View style={styles.speakerRow}>
                <Text style={styles.dialogueSpeaker}>Kasumi</Text>
                <Text style={styles.speakerHeart}>♡</Text>
              </View>
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
                    onPress={() => { playTap(); c.onPress(); }}
                    style={({ pressed }) => [
                      styles.choice,
                      i === 0 && (netNeg ? styles.choicePrimaryConcerned : styles.choicePrimary),
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
  safe: { flex: 1, backgroundColor: PALETTE.bg },

  // Layered pastel background
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PALETTE.bg,
  },
  bgGlowPink: {
    position: 'absolute',
    top: -100, right: -120,
    width: 360, height: 360,
    borderRadius: 180,
    backgroundColor: PALETTE.bgAccent,
    opacity: 0.5,
  },
  bgGlowPurple: {
    position: 'absolute',
    bottom: SCREEN_H * 0.25, left: -100,
    width: 320, height: 320,
    borderRadius: 160,
    backgroundColor: '#e9d5ff',
    opacity: 0.45,
  },

  sparkle: {
    position: 'absolute',
    color: PALETTE.accent,
    opacity: 0.6,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  name:    { color: PALETTE.textPrimary, fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: -0.3 },
  heart:   { fontSize: 16, color: PALETTE.pink },

  tierPill: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tierText: { fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: PALETTE.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  close:   { color: PALETTE.textSecondary, fontSize: 16, fontWeight: FontWeight.bold },

  affRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  affTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: Radius.full, overflow: 'hidden', borderWidth: 0.5, borderColor: PALETTE.cardBorder },
  affFill:  { height: '100%', borderRadius: Radius.full },
  affText:  { color: PALETTE.textSecondary, fontSize: 11, fontVariant: ['tabular-nums'], fontWeight: FontWeight.semibold },

  portraitWrap: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  portraitGlow: {
    position: 'absolute',
    width: Math.min(SCREEN_W * 0.9, 380),
    height: Math.min(SCREEN_W * 0.9, 380) * 4 / 3,
    borderRadius: 30,
    backgroundColor: PALETTE.accent + '25',
    transform: [{ scale: 1.04 }],
  },
  portraitFrame: {
    width: Math.min(SCREEN_W * 0.85, 360),
    height: Math.min(SCREEN_W * 0.85, 360) * 4 / 3,
    borderRadius: 26,
    borderWidth: 4,
    padding: 0,
    backgroundColor: '#fff',
    shadowColor: PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  portrait: {
    width: '100%', height: '100%',
    borderRadius: 22,
    backgroundColor: '#eee',
  },

  dialogueWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  dialogueBox: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: Spacing.lg,
    shadowColor: PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  dialogueBoxConcerned: {
    backgroundColor: PALETTE.concernBg,
    borderColor: PALETTE.concernBorder,
  },
  dialogueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 6,
  },
  speakerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  dialogueSpeaker: { fontSize: 13, fontWeight: FontWeight.bold, color: PALETTE.accentDeep, letterSpacing: 0.5, textTransform: 'uppercase' },
  speakerHeart:    { fontSize: 12, color: PALETTE.pink },
  dialogueHint:    { fontSize: 10, color: PALETTE.textMuted, fontStyle: 'italic' },
  dialogueBody:    { paddingVertical: 4 },
  dialogueText:    { fontSize: 16, color: PALETTE.textPrimary, lineHeight: 23 },

  choices: { marginTop: Spacing.lg, gap: Spacing.sm },
  choice: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    backgroundColor: '#faf5ff',
    alignItems: 'center',
  },
  choicePrimary: {
    backgroundColor: PALETTE.accentDeep,
    borderColor: PALETTE.accentDeep,
  },
  choicePrimaryConcerned: {
    backgroundColor: PALETTE.pink,
    borderColor: PALETTE.pink,
  },
  choiceText:        { fontSize: 14, fontWeight: FontWeight.semibold, color: PALETTE.textPrimary },
  choiceTextPrimary: { color: '#fff' },
});
