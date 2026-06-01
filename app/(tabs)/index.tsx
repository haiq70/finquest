import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  EmptyState,
  GoalCard,
  SectionTitle,
  TransactionItem,
  XpBar,
} from '../../src/components';
import AddTransactionModal from '../../src/components/AddTransactionModal';
import { GlassCard, ScreenBackground } from '../../src/components/Glass';
import { VNBackdrop, VN_BACKDROP_HEIGHT } from '../../src/components/VNBackdrop';
import { ACHIEVEMENTS, RARITY_COLORS } from '../../src/kasumi/achievements';
import { tierFromAffection, pickLineFor, portraitsFor, getCharacter, type Mood } from '../../src/characters';
import { KasumiDialogueModal } from '../../src/kasumi/KasumiDialogueModal';
import { MULTIPLIER_STREAK_GATE, streakMultiplier } from '../../src/kasumi/xp';
import { playTap } from '../../src/utils/sound';
import { useStore } from '../../src/store/useStore';
import { FontWeight, Radius, Spacing, XP_PER_LEVEL } from '../../src/theme';
import { fmtCurrency, getGreeting } from '../../src/utils/format';

// Lavender/pink palette — overrides Colors where the restyle calls for it.
const PALETTE = {
  bg:           '#faf5ff',
  bgAccent:     '#fce7f3',
  cardBg:       '#ffffff',
  cardBorder:   '#ede9fe',
  textPrimary:  '#3b0764',
  textSecondary:'#7e22ce',
  textMuted:    '#a78bfa',
  accent:       '#a855f7',
  accentDeep:   '#7c3aed',
  pink:         '#ec4899',
  pinkDeep:     '#be185d',
  income:       '#22c55e',
  expense:      '#ef4444',
};

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [kasumiOpen, setKasumiOpen]     = useState(false);

  const transactions      = useStore(s => s.transactions);
  const xp                = useStore(s => s.xp);
  const streak            = useStore(s => s.streak);
  const savingStreak      = useStore(s => s.savingStreak);
  const goals             = useStore(s => s.goals);
  const lastXpAward       = useStore(s => s.lastXpAward);
  const unlockedIds       = useStore(s => s.unlockedAchievementIds);
  const coins             = useStore(s => s.coins);
  const activeXpBoost     = useStore(s => s.activeXpBoost);
  const activeCoinBoost   = useStore(s => s.activeCoinBoost);
  const lastCoinAward     = useStore(s => s.lastCoinAward);
  const clearLastCoinAward= useStore(s => s.clearLastCoinAward);
  const getTotals         = useStore(s => s.getTotals);
  const getLevel          = useStore(s => s.getLevel);
  const getXpInLevel      = useStore(s => s.getXpInLevel);
  const deleteTransaction = useStore(s => s.deleteTransaction);

  // ── Kasumi state for the VN backdrop ─────────────────────────
  const affection      = useStore(s => s.affection);
  const currentMood    = useStore(s => s.currentMood);
  const currentLine    = useStore(s => s.currentLine);
  const hasMet         = useStore(s => s.hasMet);
  const markMet        = useStore(s => s.markMet);
  const refreshIdle    = useStore(s => s.refreshIdleLine);
  const tickMood       = useStore(s => s.tickMood);
  const isNetNegative  = useStore(s => s.isNetNegative);
  const activeCharId   = useStore(s => s.activeCharacterId);
  const activeChar     = getCharacter(activeCharId);
  const charFaces      = portraitsFor(activeCharId);
  const kasumiTier     = tierFromAffection(affection);

  const { income, expenses, balance } = getTotals();
  const level     = getLevel();
  const xpInLevel = getXpInLevel();
  const recent    = transactions.slice(0, 4);
  const isNetNeg  = expenses > 0 && expenses > income;

  // ── XP-award toast ───────────────────────────────────────────
  // Fades in/out when a new award arrives. We watch a key derived
  // from the award so re-renders don't retrigger it.
  const [toast, setToast] = useState<{ text: string; locked: boolean } | null>(null);
  const fade = React.useRef(new Animated.Value(0)).current;
  const lastAwardKey = lastXpAward ? `${lastXpAward.amount}|${lastXpAward.tierLabel}` : null;

  useEffect(() => {
    if (!lastXpAward || lastXpAward.amount === 0) return;
    setToast({
      text: `+${lastXpAward.amount} XP · ${lastXpAward.tierLabel}`,
      locked: lastXpAward.multiplierLocked,
    });
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(fade, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => setToast(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAwardKey]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete transaction', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  }, [deleteTransaction]);

  const multiplierUnlocked = savingStreak >= MULTIPLIER_STREAK_GATE;

  // Greet on first ever open; refresh an idle line if none is set.
  useEffect(() => {
    if (!hasMet) {
      markMet();
    } else if (!currentLine) {
      refreshIdle();
    }
    tickMood();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kasumiNetNeg = isNetNegative();
  const kasumiMood: Mood = kasumiNetNeg ? 'sad' : currentMood;
  const kasumiLine = kasumiNetNeg
    ? pickLineFor(activeCharId, 'net_negative', kasumiTier.key)
    : (currentLine || pickLineFor(activeCharId, 'idle', kasumiTier.key));

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollVN}
      >
        {/* ── Visual-novel character backdrop ── */}
        <View>
          <VNBackdrop
            source={charFaces[kasumiMood]}
            line={kasumiLine}
            speaker={activeChar.name}
            status={`${getGreeting()} · Level ${level}${streak > 0 ? `  ·  ${streak}d 🔥${streakMultiplier(streak) > 1 ? ` ${streakMultiplier(streak).toFixed(2).replace(/\.?0+$/, '')}×` : ''}` : ''}`}
            badge={kasumiTier.label}
            badgeColor={activeChar.accent}
          />
          {/* Settings gear over the top-right of the backdrop */}
          <TouchableOpacity
            style={styles.vnGear}
            onPress={() => { playTap(); router.push('/settings'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-sharp" size={18} color="#fff" />
          </TouchableOpacity>
          {/* Character-select button, top-left under the badge */}
          <TouchableOpacity
            style={styles.vnSwitchBtn}
            onPress={() => { playTap(); router.push('/characters'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={16} color="#fff" />
          </TouchableOpacity>
          {/* Tap-to-talk button, bottom-right over the backdrop */}
          <TouchableOpacity
            style={styles.vnTalkBtn}
            onPress={() => { playTap(); setKasumiOpen(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.vnTalkText}>Talk  ♡</Text>
          </TouchableOpacity>
        </View>

        {/* ── Panels float over the faded extension of the backdrop ── */}
        <View style={styles.vnBody}>
          {/* Balance panel — taps through to transactions */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => { playTap(); router.push('/transactions'); }}>
            <GlassCard variant="dark" style={styles.vnBalanceCard}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>NET BALANCE  ✦</Text>
                <TouchableOpacity
                  style={styles.coinPill}
                  onPress={() => { playTap(); router.push('/shop'); }}
                >
                  <Image source={require('../../assets/images/ui/coin.png')} style={styles.coinPillIcon} />
                  <Text style={styles.coinPillText}>{coins.toLocaleString()} FC</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.heroBalance, isNetNeg && { color: '#fda4af' }]}>
                {fmtCurrency(balance)}
              </Text>
              {(activeXpBoost && Date.now() < activeXpBoost.expiresAt) && (
                <View style={styles.heroBoostBadge}>
                  <Text style={styles.heroBoostText}>⚡ {activeXpBoost.multiplier}× XP active</Text>
                </View>
              )}
              {(activeCoinBoost && Date.now() < activeCoinBoost.expiresAt) && (
                <View style={styles.heroBoostBadge}>
                  <Text style={styles.heroBoostText}>🧲 +{Math.round(activeCoinBoost.multiplier * 100)}% coins active</Text>
                </View>
              )}
              <View style={styles.heroDivider} />
              <View style={styles.heroStats}>
                <View>
                  <Text style={[styles.heroStatVal, { color: '#86efac' }]}>{fmtCurrency(income)}</Text>
                  <Text style={styles.heroStatLabel}>Income</Text>
                </View>
                <View style={styles.heroStatSep} />
                <View>
                  <Text style={[styles.heroStatVal, { color: '#fca5a5' }]}>{fmtCurrency(expenses)}</Text>
                  <Text style={styles.heroStatLabel}>Spent</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Saving-streak / multiplier panel */}
          <GlassCard
            variant={multiplierUnlocked ? 'strong' : 'light'}
            style={styles.streakBannerGlass}
          >
            <View style={styles.streakBannerRow}>
              <Text style={styles.streakIcon}>{multiplierUnlocked ? '✨' : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakTitle}>
                  {multiplierUnlocked ? 'XP multipliers unlocked' : 'Save daily to unlock multipliers'}
                </Text>
                <Text style={styles.streakSub}>
                  {multiplierUnlocked
                    ? `${savingStreak}-day saving streak · 1.5×/2×/3× on €100/€300/€500+`
                    : `${savingStreak} / ${MULTIPLIER_STREAK_GATE} days saving in a row`}
                </Text>
              </View>
              <View style={[styles.streakDot, multiplierUnlocked && { backgroundColor: PALETTE.pink }]} />
            </View>
          </GlassCard>

        {/* XP bar */}
        <XpBar xp={xp} level={level} xpInLevel={xpInLevel} xpCap={XP_PER_LEVEL} />

        {/* Goals */}
        {goals.length > 0 && (
          <>
            <SectionTitle>Goals  ♡</SectionTitle>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalsRow}
            >
              {goals.map(g => <GoalCard key={g.id} goal={g} />)}
            </ScrollView>
          </>
        )}

        {/* Achievements teaser */}
        <AchievementsTeaser unlockedIds={unlockedIds} />

        {/* Recent transactions */}
        <View style={styles.recentHeader}>
          <SectionTitle style={{ marginTop: Spacing.sm }}>Recent  ✦</SectionTitle>
          {transactions.length > 4 && (
            <TouchableOpacity onPress={() => router.push('/transactions')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {recent.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No transactions yet"
            sub="Tap + to log your first entry — income earns XP, expenses don't"
          />
        ) : (
          <GlassCard style={styles.recentGlass} noPadding>
            <View style={styles.recentGlassInner}>
              {recent.map(tx => (
                <TransactionItem key={tx.id} item={tx} onLongPress={handleDelete} />
              ))}
            </View>
          </GlassCard>
        )}
        </View>

      </ScrollView>

      {/* XP-award toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: fade }]} pointerEvents="none">
          <Text style={styles.toastSparkle}>✦</Text>
          <Text style={styles.toastText}>{toast.text}</Text>
          {toast.locked && <Text style={styles.toastLock}>· streak locks bigger bonus</Text>}
        </Animated.View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { playTap(); setModalVisible(true); }} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      <KasumiDialogueModal
        visible={kasumiOpen}
        onClose={() => setKasumiOpen(false)}
        onAddTransaction={() => setModalVisible(true)}
        onOpenGoals={() => router.push('/goals')}
      />
    </ScreenBackground>
  );
}

// ── Achievements teaser widget ────────────────────────────────────────
function AchievementsTeaser({ unlockedIds }: { unlockedIds: string[] }) {
  const total    = ACHIEVEMENTS.length;
  const unlocked = unlockedIds.length;
  const pct      = Math.round((unlocked / total) * 100);

  // Show the 3 most recently unlocked
  const recentUnlocked = ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .slice(-3)
    .reverse();

  return (
    <TouchableOpacity
      style={teaserStyles.card}
      onPress={() => router.push('/achievements')}
      activeOpacity={0.85}
    >
      <View style={teaserStyles.header}>
        <Text style={teaserStyles.title}>Achievements</Text>
        <Text style={teaserStyles.count}>{unlocked}/{total}</Text>
      </View>
      <View style={teaserStyles.track}>
        <View style={[teaserStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <View style={teaserStyles.row}>
        {recentUnlocked.length > 0 ? (
          <>
            <View style={teaserStyles.icons}>
              {recentUnlocked.map(a => {
                const c = RARITY_COLORS[a.rarity];
                return (
                  <View key={a.id} style={[teaserStyles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
                    <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={teaserStyles.sub}>
              Latest: {recentUnlocked[0].title}
            </Text>
          </>
        ) : (
          <Text style={teaserStyles.sub}>Log a transaction to earn your first achievement</Text>
        )}
        <Text style={teaserStyles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const teaserStyles = StyleSheet.create({
  card:   { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: '#4c1d95', borderRadius: Radius.xl, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  title:  { fontSize: 14, fontWeight: FontWeight.bold, color: '#fff' },
  count:  { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: FontWeight.semibold },
  track:  { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md },
  fill:   { height: '100%', borderRadius: Radius.full, backgroundColor: '#a78bfa' },
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icons:  { flexDirection: 'row', gap: 4 },
  badge:  { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sub:    { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  arrow:  { fontSize: 20, color: 'rgba(255,255,255,0.4)' },
});

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: 'transparent' },
  bgPattern:   { flex: 1 },
  scroll:      { paddingBottom: 100 },
  scrollVN:    { paddingBottom: 110 },

  // ── Visual-novel hub ──
  vnGear: {
    position: 'absolute', top: 14, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(76,29,149,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  vnSwitchBtn: {
    position: 'absolute', top: 56, left: 16,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(76,29,149,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  vnTalkBtn: {
    position: 'absolute', right: 16,
    top: VN_BACKDROP_HEIGHT * 0.52,
    backgroundColor: 'rgba(236,72,153,0.9)',
    borderRadius: Radius.full,
    paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#be185d', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  vnTalkText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.3 },
  vnBody: {
    marginTop: Spacing.md,    // clear gap below the dialogue box
    paddingHorizontal: Spacing.lg,
  },
  vnBalanceCard: { marginBottom: Spacing.lg, padding: Spacing.sm },

  pageGlow: {
    position: 'absolute',
    top: -120, right: -80,
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: PALETTE.bgAccent,
    opacity: 0.5,
  },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  greeting:    { fontSize: 22, fontWeight: FontWeight.bold, color: PALETTE.textPrimary, letterSpacing: -0.5 },
  subheading:  { fontSize: 13, color: PALETTE.textSecondary, marginTop: 2 },
  avatar:      { width: 42, height: 42, borderRadius: 21, backgroundColor: PALETTE.accentDeep, alignItems: 'center', justifyContent: 'center', shadowColor: PALETTE.accentDeep, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  avatarText:  { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold },
  avatarGear:  { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PALETTE.cardBorder },

  hero: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#4c1d95',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    overflow: 'hidden',
    shadowColor: PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  heroBgGlow: {
    position: 'absolute',
    top: -60, right: -60,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: PALETTE.pink,
    opacity: 0.18,
  },
  heroTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  heroLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, fontWeight: FontWeight.semibold },
  coinPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)',
                 borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  coinPillIcon:{ width: 16, height: 16 },
  coinPillText:{ fontSize: 12, color: '#fef3c7', fontWeight: FontWeight.bold },
  heroBoostBadge:{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full,
                   paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  heroBoostText: { fontSize: 11, color: '#fef3c7', fontWeight: FontWeight.semibold },
  heroBalance: { fontSize: 42, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: -1.5 },
  heroUpdated: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: Spacing.lg },
  heroStats:   { flexDirection: 'row', alignItems: 'center' },
  heroStatVal: { fontSize: 17, fontWeight: FontWeight.bold },
  heroStatLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  heroStatSep: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.xl },

  streakBannerGlass: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  streakBannerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakIcon:  { fontSize: 22 },
  streakTitle: { fontSize: 13, fontWeight: FontWeight.bold, color: PALETTE.textPrimary },
  streakSub:   { fontSize: 11, color: PALETTE.textSecondary, marginTop: 2 },
  streakDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: PALETTE.textMuted },

  goalsRow:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  txList:      { paddingHorizontal: Spacing.lg },
  recentGlass: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  recentGlassInner: { paddingHorizontal: Spacing.md, paddingVertical: 4 },
  recentHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: Spacing.lg },
  seeAllBtn:   { marginTop: Spacing.sm, paddingVertical: 4, paddingHorizontal: 8 },
  seeAllText:  { fontSize: 12, fontWeight: FontWeight.bold, color: PALETTE.pink },

  // XP toast
  toast: {
    position: 'absolute',
    top: 80, alignSelf: 'center',
    // Wrap + cap the width so long streak-multiplier labels stay on screen
    // instead of overflowing past the rounded pill and getting clipped.
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 6, maxWidth: '90%',
    backgroundColor: PALETTE.accentDeep,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.lg,
    shadowColor: PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  toastSparkle: { color: '#fbbf24', fontSize: 14 },
  toastText:    { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.3,
                  flexShrink: 1, textAlign: 'center' },
  toastLock:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontStyle: 'italic',
                  flexShrink: 1, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: PALETTE.pink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PALETTE.pink, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: FontWeight.bold },
});
