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

// Mood badge icons (kawaii heart / sparkle / teardrop) shown on the portrait.
const MOOD_ICONS: Record<Mood, any> = {
  happy:   require('../../assets/images/ui/mood_happy.png'),
  neutral: require('../../assets/images/ui/mood_neutral.png'),
  sad:     require('../../assets/images/ui/mood_sad.png'),
};

const HEART_BTN     = require('../../assets/images/ui/heart_button.png');
const SPARKLE       = require('../../assets/images/ui/sparkle.png');
const DOT           = require('../../assets/images/ui/dot.png');
const HEART_SPARKLE = require('../../assets/images/ui/heart-sparkle.png');

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
      <Image source={SPARKLE} style={[styles.sparkleImg, { top: 8, right: 16, width: 22, height: 22 }]} />
      <Image source={DOT}     style={[styles.sparkleImg, { bottom: 92, right: 34, width: 14, height: 14, opacity: 0.7 }]} />
      <Image source={SPARKLE} style={[styles.sparkleImg, { top: 38, left: 12, width: 13, height: 13, opacity: 0.6 }]} />

      {/* Top row: large portrait + identity */}
      <View style={styles.topRow}>
        <View style={styles.portraitWrap}>
          <View style={[styles.portraitRing, { borderColor: tier.accent + '55' }]} />
          <Image source={FACES[displayMood]} style={styles.portrait} resizeMode="cover" />
          <Image source={MOOD_ICONS[displayMood]} style={styles.moodIcon} resizeMode="contain" />
        </View>

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>Kasumi</Text>
            <Image source={HEART_SPARKLE} style={styles.nameHeart} resizeMode="contain" />
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
            <Image source={HEART_BTN} style={styles.bubbleCtaImg} resizeMode="contain" />
            <Text style={styles.bubbleCta}>Tap to talk</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
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

  sparkleImg: {
    position: 'absolute',
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
  moodIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28,
  },

  identity: { flex: 1, gap: 6 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:     { fontSize: 19, fontWeight: FontWeight.bold, color: '#4c1d95', letterSpacing: -0.3 },
  nameHeart: { width: 18, height: 18 },

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
  bubbleCtaImg:   { width: 16, height: 16 },
  bubbleCta:      { fontSize: 11, color: '#be185d', fontWeight: FontWeight.bold, letterSpacing: 0.3 },
});
