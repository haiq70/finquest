import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated, View, Text, StyleSheet, Pressable,
} from 'react-native';
import { RARITY_COLORS, RARITY_LABELS, type AchievementDef } from '../kasumi/achievements';
import { tierFromAffection } from '../kasumi/dialogue';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, FontWeight } from '../theme';

interface Props {
  achievement: AchievementDef;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  const affection = useStore(s => s.affection);
  const tier      = tierFromAffection(affection);
  const line      = achievement.kasumiLines[tier.key]
    ?? achievement.kasumiLines.stranger
    ?? '';

  const colors = RARITY_COLORS[achievement.rarity];

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,    duration: 280, useNativeDriver: true }),
    ]).start(({ finished }) => {
      // Only fire the callback if the animation ran to completion —
      // prevents double-clearing if the component unmounts mid-animation.
      if (finished) onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    // Auto-dismiss after 4.5 s
    const timer = setTimeout(dismiss, 4500);
    return () => clearTimeout(timer);
  }, [translateY, opacity, dismiss]);

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }], opacity }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}
        onPress={dismiss}
      >
        {/* Glow bar */}
        <View style={[styles.glowBar, { backgroundColor: colors.glow }]} />

        <View style={styles.row}>
          {/* Icon */}
          <View style={[styles.iconWrap, { borderColor: colors.border }]}>
            <Text style={styles.icon}>{achievement.icon}</Text>
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <View style={styles.topLine}>
              <Text style={styles.unlocked}>Achievement Unlocked</Text>
              <View style={[styles.rarityPill, { backgroundColor: colors.glow + '55' }]}>
                <Text style={[styles.rarityLabel, { color: colors.text }]}>
                  {RARITY_LABELS[achievement.rarity]}
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{achievement.title}</Text>
            <Text style={styles.desc} numberOfLines={1}>{achievement.description}</Text>
          </View>
        </View>

        {/* Kasumi line */}
        {line ? (
          <View style={[styles.kasumiBubble, { borderColor: colors.border }]}>
            <Text style={styles.kasumiFace}>♡ Kasumi:</Text>
            <Text style={styles.kasumiText} numberOfLines={2}>{line}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// ── Queue controller — renders one at a time, steps through the queue ─
export function AchievementQueue() {
  const pending          = useStore(s => s.pendingAchievements);
  const clearPending     = useStore(s => s.clearPendingAchievements);
  const shiftPending     = useStore(s => s.shiftPendingAchievement);

  if (pending.length === 0) return null;

  // If there's only one left, dismissing it clears the queue entirely.
  // If there are more, dismissing advances to the next.
  const onDismiss = pending.length <= 1 ? clearPending : shiftPending;

  return (
    <AchievementToast
      key={pending[0].id}
      achievement={pending[0]}
      onDismiss={onDismiss}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 1000,
    paddingTop: 52,   // clear status bar
    paddingHorizontal: Spacing.lg,
    pointerEvents: 'box-none',
  } as any,

  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  glowBar: {
    height: 4,
    width: '100%',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },

  iconWrap: {
    width: 50, height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  icon: { fontSize: 26 },

  textBlock: { flex: 1 },
  topLine:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  unlocked:  { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  rarityPill:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  rarityLabel:{ fontSize: 9, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  title:     { fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: -0.2 },
  desc:      { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  kasumiBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderTopWidth: 0.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  kasumiFace: { fontSize: 11, fontWeight: FontWeight.bold, color: '#ec4899', flexShrink: 0, marginTop: 1 },
  kasumiText: { flex: 1, fontSize: 12, color: Colors.textPrimary, lineHeight: 17, fontStyle: 'italic' },
});
