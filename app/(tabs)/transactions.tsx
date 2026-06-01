import React, { useState, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet, Alert, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../../src/store/useStore';
import { TransactionItem, EmptyState, SectionTitle } from '../../src/components';
import { GlassCard, ScreenBackground } from '../../src/components/Glass';
import AddTransactionModal from '../../src/components/AddTransactionModal';
import { Colors, Spacing, Radius, FontWeight } from '../../src/theme';
import { groupByDate } from '../../src/utils/format';
import { useMoney } from '../../src/utils/money';

export default function TransactionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const transactions      = useStore(s => s.transactions);
  const deleteTransaction = useStore(s => s.deleteTransaction);
  const getTotals         = useStore(s => s.getTotals);
  const fmt               = useMoney();

  const { income, expenses } = getTotals();

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  const FILTERS: Array<{ key: typeof filter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expenses' },
  ];

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        <GlassCard variant="strong" style={styles.summaryCard} noPadding>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>Total In</Text>
            <Text style={[styles.summaryVal, { color: Colors.income }]}>{fmt(income)}</Text>
          </View>
        </GlassCard>
        <GlassCard variant="strong" style={[styles.summaryCard, { marginHorizontal: Spacing.sm }]} noPadding>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>Total Out</Text>
            <Text style={[styles.summaryVal, { color: Colors.expense }]}>{fmt(expenses)}</Text>
          </View>
        </GlassCard>
        <GlassCard variant="strong" style={styles.summaryCard} noPadding>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>Entries</Text>
            <Text style={styles.summaryVal}>{transactions.length}</Text>
          </View>
        </GlassCard>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, filter === f.key && styles.pillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={{ marginTop: Spacing.xl }}>
          <EmptyState icon="📭" title="Nothing here" sub="Try a different filter or log a transaction" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionItem item={item} onLongPress={handleDelete} />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: 'transparent' },
  summaryRow:   { flexDirection: 'row', margin: Spacing.lg, marginBottom: Spacing.sm },
  summaryCard:  { flex: 1 },
  summaryInner: { padding: Spacing.md, alignItems: 'flex-start' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryVal:   { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  filterRow:    { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  pill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  pillActive:   { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  pillText:     { fontSize: 13, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  pillTextActive:{ color: '#fff' },
  list:         { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  sectionHeader:{ fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: Spacing.md },
  fab:          { position: 'absolute', bottom: 24, alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center', shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabIcon:      { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: FontWeight.bold },
});
