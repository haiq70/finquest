import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import {
  XpBar, GoalCard, TransactionItem, SectionTitle, EmptyState,
} from '../../src/components';
import AddTransactionModal from '../../src/components/AddTransactionModal';
import { Colors, Spacing, Radius, FontWeight, XP_PER_LEVEL } from '../../src/theme';
import { fmtCurrency, getGreeting } from '../../src/utils/format';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const transactions      = useStore(s => s.transactions);
  const xp                = useStore(s => s.xp);
  const streak            = useStore(s => s.streak);
  const goals             = useStore(s => s.goals);
  const getTotals         = useStore(s => s.getTotals);
  const getLevel          = useStore(s => s.getLevel);
  const getXpInLevel      = useStore(s => s.getXpInLevel);
  const deleteTransaction = useStore(s => s.deleteTransaction);

  const { income, expenses, balance } = getTotals();
  const level     = getLevel();
  const xpInLevel = getXpInLevel();
  const recent    = transactions.slice(0, 6);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete transaction', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  }, [deleteTransaction]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.subheading}>
              Level {level} Saver · {streak > 0 ? `${streak} day streak 🔥` : 'Start your streak!'}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>ME</Text>
          </View>
        </View>

        {/* Balance hero card */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <Text style={styles.heroBalance}>{fmtCurrency(balance)}</Text>
          <Text style={styles.heroUpdated}>Updated just now</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View>
              <Text style={[styles.heroStatVal, { color: Colors.income }]}>{fmtCurrency(income)}</Text>
              <Text style={styles.heroStatLabel}>Income</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View>
              <Text style={[styles.heroStatVal, { color: '#f87171' }]}>{fmtCurrency(expenses)}</Text>
              <Text style={styles.heroStatLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* XP bar */}
        <XpBar xp={xp} level={level} xpInLevel={xpInLevel} xpCap={XP_PER_LEVEL} />

        {/* Goals */}
        {goals.length > 0 && (
          <>
            <SectionTitle>Goals</SectionTitle>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalsRow}
            >
              {goals.map(g => <GoalCard key={g.id} goal={g} />)}
            </ScrollView>
          </>
        )}

        {/* Recent transactions */}
        <SectionTitle style={{ marginTop: Spacing.sm }}>Recent</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No transactions yet"
            sub="Tap + to log your first entry and earn 20 XP"
          />
        ) : (
          <View style={styles.txList}>
            {recent.map(tx => (
              <TransactionItem key={tx.id} item={tx} onLongPress={handleDelete} />
            ))}
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  scroll:      { paddingBottom: 100 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  greeting:    { fontSize: 20, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  subheading:  { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  avatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: '#fff', fontSize: 13, fontWeight: FontWeight.semibold },

  hero:        { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: Spacing.xxl },
  heroLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.9, marginBottom: 6 },
  heroBalance: { fontSize: 40, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: -1.5 },
  heroUpdated: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: Spacing.lg },
  heroStats:   { flexDirection: 'row', alignItems: 'center' },
  heroStatVal: { fontSize: 17, fontWeight: FontWeight.semibold },
  heroStatLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  heroStatSep: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.xl },

  goalsRow:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  txList:      { paddingHorizontal: Spacing.lg },

  fab:         { position: 'absolute', bottom: 24, alignSelf: 'center', width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabIcon:     { color: '#fff', fontSize: 26, lineHeight: 30 },
});
