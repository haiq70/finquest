import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, FontWeight } from '../theme';
import {
  tierFromAffection,
  type Mood,
} from '../kasumi/dialogue';
import { AFFECTION_MAX } from '../kasumi/affection';

// Static requires so Metro can bundle them.
const FACES: Record<Mood, any> = {
  neutral: require('../../assets/images/kasumi/neutral.png'),
  happy:   require('../../assets/images/kasumi/happy.jpeg'),
  sad:     require('../../assets/images/kasumi/sad.jpeg'),
};

interface KasumiCardProps {
  onOpenDialogue?: () => void;
}

export function KasumiCard({ onOpenDialogue }: KasumiCardProps) {
  const affection    = useStore(s => s.affection);
  const hasMet       = useStore(s => s.hasMet);
  const currentMood  = useStore(s => s.currentMood);
  const currentLine  = useStore(s => s.currentLine);
  const moodExpires  = useStore(s => s.moodExpiresAt);
  const markMet      = useStore(s => s.markMet);
  const refreshIdle  = useStore(s => s.refreshIdleLine);
  const tickMood     = useStore(s => s.tickMood);

  const tier = useMemo(() => tierFromAffection(affection), [affection]);

  // First-meeting bootstrap.
  useEffect(() => {
    if (!hasMet) {
      markMet();
    } else if (!currentLine) {
      refreshIdle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Relax expired moods back to idle.
  useEffect(() => {
    if (!moodExpires) return;
    const remaining = moodExpires - Date.now();
    if (remaining <= 0) {
      tickMood();
      return;
    }
    const t = setTimeout(tickMood, remaining + 50);
    return () => clearTimeout(t);
  }, [moodExpires, tickMood]);

  const pct = Math.round((affection / AFFECTION_MAX) * 100);

  return (
    <Pressable
      onPress={onOpenDialogue}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      {/* Top row: portrait + name/tier + affection ring */}
      <View style={styles.topRow}>
        <View style={styles.portraitWrap}>
          <Image source={FACES[currentMood]} style={styles.portrait} resizeMode="cover" />
          <View style={[styles.moodDot, moodDotStyle(currentMood)]} />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>Kasumi</Text>
          <View style={[styles.tierPill, { backgroundColor: tier.accent + '22', borderColor: tier.accent }]}>
            <Text style={[styles.tierText, { color: tier.accent }]}>{tier.label}</Text>
          </View>
          <View style={styles.affWrap}>
            <View style={styles.affTrack}>
              <View
                style={[
                  styles.affFill,
                  { width: `${pct}%` as any, backgroundColor: tier.accent },
                ]}
              />
            </View>
            <Text style={styles.affNum}>{affection} / {AFFECTION_MAX}</Text>
          </View>
        </View>
      </View>

      {/* Speech bubble */}
      {currentLine ? (
        <View style={styles.bubble}>
          <View style={styles.bubbleTick} />
          <Text style={styles.bubbleText} numberOfLines={3}>
            {currentLine}
          </Text>
          <Text style={styles.bubbleCta}>Tap to talk →</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function moodDotStyle(mood: Mood) {
  switch (mood) {
    case 'happy': return { backgroundColor: '#22c55e' };
    case 'sad':   return { backgroundColor: '#ef4444' };
    default:      return { backgroundColor: '#a78bfa' };
  }
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#faf8ff',
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: '#e9e3ff',
    padding: Spacing.lg,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },

  portraitWrap: { position: 'relative' },
  portrait:     {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: '#fff',
    backgroundColor: '#eee',
  },
  moodDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#fff',
  },

  identity: { flex: 1, gap: 6 },
  name:     { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3 },

  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tierText: { fontSize: 11, fontWeight: FontWeight.semibold, letterSpacing: 0.3 },

  affWrap:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  affTrack: { flex: 1, height: 6, backgroundColor: '#ece4ff', borderRadius: Radius.full, overflow: 'hidden' },
  affFill:  { height: '100%', borderRadius: Radius.full },
  affNum:   { fontSize: 11, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },

  bubble: {
    marginTop: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: '#e9e3ff',
    padding: Spacing.md,
    paddingTop: Spacing.md + 2,
  },
  bubbleTick: {
    position: 'absolute', top: -6, left: 28,
    width: 12, height: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5, borderLeftWidth: 0.5,
    borderColor: '#e9e3ff',
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  bubbleCta:  { fontSize: 11, color: '#8b5cf6', marginTop: 6, fontWeight: FontWeight.semibold },
});
