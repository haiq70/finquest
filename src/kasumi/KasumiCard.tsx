import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, FontWeight } from '../theme';
import {
  pickLine,
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
  const affection      = useStore(s => s.affection);
  const hasMet         = useStore(s => s.hasMet);
  const currentMood    = useStore(s => s.currentMood);
  const currentLine    = useStore(s => s.currentLine);
  const moodExpires    = useStore(s => s.moodExpiresAt);
  const markMet        = useStore(s => s.markMet);
  const refreshIdle    = useStore(s => s.refreshIdleLine);
  const tickMood       = useStore(s => s.tickMood);
  const isNetNegative  = useStore(s => s.isNetNegative);

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

  // Net-negative override: force sad face + concerned line.
  const netNeg = isNetNegative();
  const displayMood: Mood = netNeg ? 'sad' : currentMood;
  // Pre-pick a stable line (per affection level) when net-negative,
  // so we're not re-randomising on every render.
  const displayLine = useMemo(() => {
    if (netNeg) return pickLine('net_negative', tier.key);
    return currentLine;
  }, [netNeg, tier.key, currentLine]);

  const pct = Math.round((affection / AFFECTION_MAX) * 100);

  return (
    <Pressable
      onPress={onOpenDialogue}
      style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.94 }]}
    >
      {/* Faux gradient backdrop — layered solid pastels */}
      <View style={styles.bgBase} />
      <View style={styles.bgGlow} />

      {/* Decorative sparkles */}
      <Text style={[styles.sparkle, { top: 10, right: 18 }]}>✦</Text>
      <Text style={[styles.sparkle, { bottom: 96, right: 36, fontSize: 12, opacity: 0.5 }]}>✧</Text>
      <Text style={[styles.sparkle, { top: 40, left: 14, fontSize: 10, opacity: 0.45 }]}>✦</Text>

      {/* Top row: large portrait + identity */}
      <View style={styles.topRow}>
        <View style={styles.portraitWrap}>
          <View style={[styles.portraitRing, { borderColor: tier.accent + '55' }]} />
          <Image source={FACES[displayMood]} style={styles.portrait} resizeMode="cover" />
          <View style={[styles.moodDot, moodDotStyle(displayMood)]} />
        </View>

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>Kasumi</Text>
            <Text style={styles.heart}>♡</Text>
          </View>
          <View style={[styles.tierPill, { backgroundColor: tier.accent + '22', borderColor: tier.accent + '88' }]}>
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
      {displayLine ? (
        <View style={[styles.bubble, netNeg && styles.bubbleConcerned]}>
          <View style={[styles.bubbleTick, netNeg && styles.bubbleTickConcerned]} />
          <Text style={styles.bubbleText} numberOfLines={3}>
            {displayLine}
          </Text>
          <View style={styles.bubbleCtaWrap}>
            <Text style={styles.bubbleCtaHeart}>♡</Text>
            <Text style={styles.bubbleCta}>Tap to talk</Text>
          </View>
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
  cardWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },

  // Faux gradient layers
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f3eaff', // base lavender
  },
  bgGlow: {
    position: 'absolute',
    top: -40, right: -40,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: '#fce7f3', // soft pink glow top-right
    opacity: 0.75,
  },

  sparkle: {
    position: 'absolute',
    color: '#c4b5fd',
    fontSize: 16,
    opacity: 0.7,
  },

  topRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },

  portraitWrap: { position: 'relative', width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  portraitRing: {
    position: 'absolute',
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2,
  },
  portrait: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 3, borderColor: '#fff',
    backgroundColor: '#eee',
  },
  moodDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#fff',
  },

  identity: { flex: 1, gap: 6 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:     { fontSize: 19, fontWeight: FontWeight.bold, color: '#4c1d95', letterSpacing: -0.3 },
  heart:    { fontSize: 14, color: '#ec4899' },

  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tierText: { fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

  affWrap:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  affTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.full, overflow: 'hidden' },
  affFill:  { height: '100%', borderRadius: Radius.full },
  affNum:   { fontSize: 11, color: '#7c3aed', fontVariant: ['tabular-nums'], fontWeight: FontWeight.semibold },

  bubble: {
    marginTop: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: '#e9e3ff',
    padding: Spacing.md,
    paddingTop: Spacing.md + 2,
  },
  bubbleConcerned: {
    backgroundColor: '#fff1f2',
    borderColor: '#fbcfe8',
  },
  bubbleTick: {
    position: 'absolute', top: -6, left: 30,
    width: 12, height: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5, borderLeftWidth: 0.5,
    borderColor: '#e9e3ff',
    transform: [{ rotate: '45deg' }],
  },
  bubbleTickConcerned: {
    backgroundColor: '#fff1f2',
    borderColor: '#fbcfe8',
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  bubbleCtaWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  bubbleCtaHeart: { fontSize: 12, color: '#ec4899' },
  bubbleCta:      { fontSize: 11, color: '#be185d', fontWeight: FontWeight.bold, letterSpacing: 0.3 },
});
