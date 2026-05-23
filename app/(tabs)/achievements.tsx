import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import {
  ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_LABELS,
  type AchievementCategory,
  type AchievementRarity,
} from '../../src/kasumi/achievements';
import { tierFromAffection } from '../../src/kasumi/dialogue';
import { Colors, Spacing, Radius, FontWeight } from '../../src/theme';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak:       '🔥 Streaks',
  saving:       '💰 Saving',
  goals:        '🎯 Goals',
  spending:     '📊 Spending',
  relationship: '💜 Kasumi',
  xp:           '⭐ XP',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'xp', 'streak', 'saving', 'goals', 'spending', 'relationship',
];

type FilterKey = 'all' | AchievementRarity;
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'legendary', label: '👑 Legendary' },
  { key: 'epic',      label: '🔮 Epic' },
  { key: 'rare',      label: '💎 Rare' },
  { key: 'common',    label: '✦ Common' },
];

export default function AchievementsScreen() {
  const unlockedIds  = useStore(s => s.unlockedAchievementIds);
  const affection    = useStore(s => s.affection);
  const tier         = tierFromAffection(affection);

  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() =>
    ACHIEVEMENTS.filter(a => filter === 'all' || a.rarity === filter),
    [filter]
  );

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map(cat => ({
      cat,
      items: filtered.filter(a => a.category === cat),
    })).filter(g => g.items.length > 0);
  }, [filtered]);

  const totalUnlocked = unlockedIds.length;
  const totalCount    = ACHIEVEMENTS.length;
  const pct           = Math.round((totalUnlocked / totalCount) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryTitle}>Your Achievements</Text>
              <Text style={styles.summaryCount}>
                {totalUnlocked} / {totalCount} unlocked
              </Text>
            </View>
            <View style={styles.pctCircle}>
              <Text style={styles.pctText}>{pct}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.tierHint}>
            Kasumi tier: <Text style={[styles.tierName, { color: tier.accent }]}>{tier.label}</Text>
            {' '}· her reactions change as you grow closer 💜
          </Text>
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, filter === f.key && styles.pillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievement groups */}
        {grouped.map(({ cat, items }) => (
          <View key={cat} style={styles.group}>
            <Text style={styles.groupTitle}>{CATEGORY_LABELS[cat]}</Text>
            {items.map(a => {
              const unlocked = unlockedIds.includes(a.id);
              const colors   = RARITY_COLORS[a.rarity];
              const line     = unlocked
                ? (a.kasumiLines[tier.key] ?? a.kasumiLines.stranger ?? '')
                : null;

              return (
                <View
                  key={a.id}
                  style={[
                    styles.card,
                    unlocked
                      ? { backgroundColor: colors.bg, borderColor: colors.border }
                      : styles.cardLocked,
                  ]}
                >
                  {/* Top glow strip for unlocked */}
                  {unlocked && (
                    <View style={[styles.glowStrip, { backgroundColor: colors.glow }]} />
                  )}

                  <View style={styles.cardBody}>
                    {/* Icon */}
                    <View style={[styles.iconWrap, !unlocked && styles.iconWrapLocked]}>
                      <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
                        {unlocked ? a.icon : '🔒'}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.aTitle, !unlocked && styles.lockedText]} numberOfLines={1}>
                          {a.title}
                        </Text>
                        <View style={[
                          styles.rarityBadge,
                          { backgroundColor: unlocked ? colors.glow + '44' : '#f1f5f9' },
                        ]}>
                          <Text style={[
                            styles.rarityText,
                            { color: unlocked ? colors.text : Colors.textMuted },
                          ]}>
                            {RARITY_LABELS[a.rarity]}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.aDesc, !unlocked && styles.lockedText]} numberOfLines={2}>
                        {a.description}
                      </Text>
                    </View>
                  </View>

                  {/* Kasumi quote for unlocked */}
                  {unlocked && line ? (
                    <View style={[styles.kasumiBubble, { borderColor: colors.border }]}>
                      <Text style={styles.kasumiFace}>♡</Text>
                      <Text style={styles.kasumiText} numberOfLines={2}>{line}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  scroll:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  summaryCard:  { backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  summaryTitle: { fontSize: 17, fontWeight: FontWeight.bold, color: '#fff', marginBottom: 4 },
  summaryCount: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  pctCircle:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  pctText:      { fontSize: 14, fontWeight: FontWeight.bold, color: '#fff' },
  progressTrack:{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: '#a78bfa' },
  tierHint:     { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  tierName:     { fontWeight: FontWeight.semibold },

  filterRow:    { gap: Spacing.sm, paddingBottom: Spacing.md },
  pill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border },
  pillActive:   { backgroundColor: Colors.dark, borderColor: Colors.dark },
  pillText:     { fontSize: 13, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  pillTextActive:{ color: '#fff' },

  group:        { marginBottom: Spacing.lg },
  groupTitle:   { fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },

  card:         { borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden' },
  cardLocked:   { backgroundColor: '#f8fafc', borderColor: '#e5e7eb' },
  glowStrip:    { height: 3, width: '100%' },
  cardBody:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },

  iconWrap:       { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e5e7eb', flexShrink: 0 },
  iconWrapLocked: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  icon:           { fontSize: 26 },
  iconLocked:     { opacity: 0.35 },

  content:    { flex: 1 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 3 },
  aTitle:     { flex: 1, fontSize: 14, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  lockedText: { color: Colors.textMuted },
  aDesc:      { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  rarityBadge:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full, flexShrink: 0 },
  rarityText: { fontSize: 9, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.3 },

  kasumiBubble: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderTopWidth: 0.5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  kasumiFace:   { fontSize: 12, color: '#ec4899', flexShrink: 0, marginTop: 1 },
  kasumiText:   { flex: 1, fontSize: 12, color: Colors.textPrimary, lineHeight: 17, fontStyle: 'italic' },
});
