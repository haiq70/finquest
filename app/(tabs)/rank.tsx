import React from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import { LeaderboardItem, SectionTitle } from '../../src/components';
import { Colors, Spacing, Radius, FontWeight } from '../../src/theme';
import { useMoney } from '../../src/utils/money';

export default function RankScreen() {
  const getLeaderboard  = useStore(s => s.getLeaderboardWithMe);
  const xp              = useStore(s => s.xp);
  const getLevel        = useStore(s => s.getLevel);
  const getMonthlyTotals= useStore(s => s.getMonthlyTotals);
  const fmt             = useMoney();

  const board   = getLeaderboard();
  const level   = getLevel();
  const monthly = getMonthlyTotals();
  const myRank  = board.find(e => e.isMe)?.rank ?? '-';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Your standing card */}
      <View style={styles.myCard}>
        <View style={styles.myLeft}>
          <Text style={styles.myLabel}>Your standing</Text>
          <Text style={styles.myRank}>#{myRank}</Text>
          <Text style={styles.myXp}>{xp.toLocaleString()} XP · Level {level}</Text>
        </View>
        <View style={styles.myRight}>
          <View style={styles.myStat}>
            <Text style={[styles.myStatVal, { color: Colors.income }]}>{fmt(monthly.income)}</Text>
            <Text style={styles.myStatLabel}>Income</Text>
          </View>
          <View style={styles.myStatSep} />
          <View style={styles.myStat}>
            <Text style={[styles.myStatVal, { color: Colors.expense }]}>{fmt(monthly.expenses)}</Text>
            <Text style={styles.myStatLabel}>Spent</Text>
          </View>
        </View>
      </View>

      <SectionTitle>Top savers this month</SectionTitle>

      <FlatList
        data={board}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <LeaderboardItem item={item} />}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  myCard:      { margin: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center' },
  myLeft:      { flex: 1 },
  myLabel:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.6, marginBottom: 4 },
  myRank:      { fontSize: 36, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: -1 },
  myXp:        { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  myRight:     { flexDirection: 'row', alignItems: 'center' },
  myStat:      { alignItems: 'flex-end' },
  myStatVal:   { fontSize: 15, fontWeight: FontWeight.semibold },
  myStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  myStatSep:   { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.md },
  list:        { paddingHorizontal: Spacing.lg },
});
