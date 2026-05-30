import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import { StatCard, SectionTitle, CategoryBar, XpBar } from '../../src/components';
import { ScreenBackground } from '../../src/components/Glass';
import { Colors, Spacing, Radius, FontWeight, XP_PER_LEVEL, type Category } from '../../src/theme';
import { fmtCurrency } from '../../src/utils/format';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StatsScreen() {
  const xp                  = useStore(s => s.xp);
  const streak              = useStore(s => s.streak);
  const transactions        = useStore(s => s.transactions);
  const getLevel            = useStore(s => s.getLevel);
  const getXpInLevel        = useStore(s => s.getXpInLevel);
  const getCategoryBreakdown= useStore(s => s.getCategoryBreakdown);
  const getMonthlyTotals    = useStore(s => s.getMonthlyTotals);

  const level      = getLevel();
  const xpInLevel  = getXpInLevel();
  const breakdown  = getCategoryBreakdown();
  const monthly    = getMonthlyTotals();
  const maxCat     = breakdown.length > 0 ? breakdown[0][1] : 1;

  // Build 7-day streak dots (today = rightmost)
  const todayDow = new Date().getDay(); // 0=Sun
  const streakDots = WEEK_DAYS.map((label, i) => {
    // i=0 is Monday, i=6 is Sunday
    const dayIndex = i === 6 ? 0 : i + 1; // convert to JS getDay()
    const isToday = dayIndex === todayDow;
    const daysAgo = ((todayDow - dayIndex + 7) % 7);
    const active = daysAgo < streak;
    return { label, isToday, active };
  });

  // Count unique days that had at least one expense this month — avoids
  // dividing by calendar days that had zero spending (misleadingly low average).
  const expenseDaysThisMonth = new Set(
    transactions
      .filter(t => {
        const d = new Date(t.date);
        const now = new Date();
        return t.type === 'expense' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
      })
      .map(t => new Date(t.date).toDateString())
  ).size;
  const avgExpense = expenseDaysThisMonth > 0
    ? monthly.expenses / expenseDaysThisMonth
    : 0;

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.topPad} />

        {/* XP / Level progress */}
        <SectionTitle>Progress</SectionTitle>
        <View style={styles.xpCard}>
          <XpBar xp={xp} level={level} xpInLevel={xpInLevel} xpCap={XP_PER_LEVEL} />
          <View style={styles.xpRow}>
            <View style={styles.xpStat}>
              <Text style={styles.xpStatVal}>{xp.toLocaleString()}</Text>
              <Text style={styles.xpStatLabel}>Total XP</Text>
            </View>
            <View style={styles.xpSep} />
            <View style={styles.xpStat}>
              <Text style={styles.xpStatVal}>{transactions.length}</Text>
              <Text style={styles.xpStatLabel}>Entries logged</Text>
            </View>
            <View style={styles.xpSep} />
            <View style={styles.xpStat}>
              <Text style={styles.xpStatVal}>{streak} 🔥</Text>
              <Text style={styles.xpStatLabel}>Day streak</Text>
            </View>
          </View>
        </View>

        {/* Monthly stats grid */}
        <SectionTitle>This month</SectionTitle>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard label="Income" value={fmtCurrency(monthly.income)} accent={Colors.income} />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Spent" value={fmtCurrency(monthly.expenses)} accent={Colors.expense} />
          </View>
          <View style={[styles.gridRow, { marginTop: Spacing.sm }]}>
            <StatCard label="Saved" value={fmtCurrency(monthly.saved)} sub="income − expenses" />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Avg/day" value={fmtCurrency(avgExpense)} sub="on days you spend" />
          </View>
        </View>

        {/* Streak tracker */}
        <SectionTitle>Weekly streak</SectionTitle>
        <View style={styles.streakRow}>
          {streakDots.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dayDot,
                d.active && !d.isToday && styles.dayDotDone,
                d.isToday && styles.dayDotToday,
              ]}
            >
              <Text style={[styles.dayDotText, (d.active || d.isToday) && { color: '#fff' }]}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Category breakdown */}
        <SectionTitle>Spending by category</SectionTitle>
        <View style={styles.catCard}>
          {breakdown.length === 0 ? (
            <Text style={styles.noCats}>No expense data yet</Text>
          ) : (
            breakdown.map(([cat, amt]) => (
              <CategoryBar key={cat} category={cat as Category} amount={amt} max={maxCat} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: 'transparent' },
  scroll:       { paddingBottom: 40 },
  topPad:       { height: Spacing.sm },

  xpCard:       { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  xpRow:        { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  xpStat:       { flex: 1, alignItems: 'center' },
  xpStatVal:    { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  xpStatLabel:  { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  xpSep:        { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },

  grid:         { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  gridRow:      { flexDirection: 'row' },

  streakRow:    { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
  dayDot:       { flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  dayDotDone:   { backgroundColor: Colors.dark, borderColor: Colors.dark },
  dayDotToday:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayDotText:   { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  catCard:      { marginHorizontal: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: Spacing.lg, marginBottom: Spacing.lg },
  noCats:       { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },
});
