import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useStore, type Goal } from '../../src/store/useStore';
import { Colors, Spacing, Radius, FontWeight } from '../../src/theme';
import { fmtCurrency } from '../../src/utils/format';
import { PrimaryButton, SectionTitle, EmptyState } from '../../src/components';

const GOAL_ICONS = ['🏖️', '💻', '🛡️', '🚗', '🏠', '📚', '💍', '✈️', '🎮', '🏋️'];
const GOAL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

export default function GoalsScreen() {
  const goals           = useStore(s => s.goals);
  const addGoal         = useStore(s => s.addGoal);
  const deleteGoal      = useStore(s => s.deleteGoal);
  const contributeToGoal= useStore(s => s.contributeToGoal);

  const [addVisible, setAddVisible]   = useState(false);
  const [contribId, setContribId]     = useState<string | null>(null);
  const [contribAmt, setContribAmt]   = useState('');

  // Add goal form state
  const [gName, setGName]     = useState('');
  const [gTarget, setGTarget] = useState('');
  const [gIcon, setGIcon]     = useState(GOAL_ICONS[0]);
  const [gColor, setGColor]   = useState(GOAL_COLORS[0]);

  const handleAddGoal = () => {
    const target = parseFloat(gTarget.replace(',', '.'));
    if (!gName.trim()) { Alert.alert('Name required'); return; }
    if (!target || target <= 0) { Alert.alert('Enter a valid target amount'); return; }
    addGoal({ name: gName.trim(), icon: gIcon, target, saved: 0, color: gColor });
    setGName(''); setGTarget(''); setGIcon(GOAL_ICONS[0]); setGColor(GOAL_COLORS[0]);
    setAddVisible(false);
  };

  const handleContribute = (goalId: string) => {
    const amt = parseFloat(contribAmt.replace(',', '.'));
    if (!amt || amt <= 0) { Alert.alert('Enter a valid amount'); return; }
    contributeToGoal(goalId, amt);
    setContribId(null);
    setContribAmt('');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(`Delete "${name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const contribGoal = goals.find(g => g.id === contribId);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ height: Spacing.sm }} />
        <SectionTitle>Your goals</SectionTitle>

        {goals.length === 0 ? (
          <EmptyState icon="🎯" title="No goals yet" sub="Add your first savings goal to get started" />
        ) : (
          goals.map(goal => {
            const pct = Math.min(1, goal.saved / goal.target);
            const remaining = goal.target - goal.saved;
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIconWrap, { backgroundColor: goal.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalAmts}>
                      {fmtCurrency(goal.saved)} saved of {fmtCurrency(goal.target)}
                    </Text>
                  </View>
                  <Text style={[styles.goalPct, { color: goal.color }]}>
                    {Math.round(pct * 100)}%
                  </Text>
                </View>
                <View style={styles.goalTrack}>
                  <View style={[styles.goalFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: goal.color }]} />
                </View>
                {pct < 1 && (
                  <Text style={styles.goalRemaining}>{fmtCurrency(remaining)} remaining</Text>
                )}
                {pct >= 1 && (
                  <Text style={[styles.goalRemaining, { color: Colors.income, fontWeight: FontWeight.semibold }]}>
                    🎉 Goal reached!
                  </Text>
                )}
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={styles.contributeBtn}
                    onPress={() => { setContribId(goal.id); setContribAmt(''); }}
                    disabled={pct >= 1}
                  >
                    <Text style={styles.contributeBtnText}>+ Contribute</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(goal.id, goal.name)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
          <Text style={styles.addBtnIcon}>＋</Text>
          <Text style={styles.addBtnText}>New goal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Contribute modal */}
      <Modal visible={!!contribId} animationType="slide" transparent onRequestClose={() => setContribId(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setContribId(null)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Contribute to {contribGoal?.name}</Text>
            <Text style={styles.fieldLabel}>Amount (€)</Text>
            <TextInput
              style={styles.input}
              value={contribAmt}
              onChangeText={setContribAmt}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <PrimaryButton label="Save" onPress={() => handleContribute(contribId!)} style={{ marginTop: Spacing.lg }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add goal modal */}
      <Modal visible={addVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setAddVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>New goal</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={gName} onChangeText={setGName} placeholder="e.g. New Laptop" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Target amount (€)</Text>
            <TextInput style={styles.input} value={gTarget} onChangeText={setGTarget} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }} contentContainerStyle={{ gap: Spacing.sm }}>
              {GOAL_ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconChip, gIcon === ic && styles.iconChipActive]} onPress={() => setGIcon(ic)}>
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, gColor === c && styles.colorDotActive]} onPress={() => setGColor(c)} />
              ))}
            </View>

            <PrimaryButton label="Create goal" onPress={handleAddGoal} style={{ marginTop: Spacing.lg }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  scroll:          { paddingHorizontal: Spacing.lg, paddingBottom: 40 },

  goalCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.sm },
  goalHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  goalIconWrap:    { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  goalInfo:        { flex: 1 },
  goalName:        { fontSize: 15, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  goalAmts:        { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  goalPct:         { fontSize: 18, fontWeight: FontWeight.bold },
  goalTrack:       { height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  goalFill:        { height: '100%', borderRadius: Radius.full },
  goalRemaining:   { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  goalActions:     { flexDirection: 'row', gap: Spacing.sm },
  contributeBtn:   { flex: 1, padding: 10, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, alignItems: 'center' },
  contributeBtnText:{ fontSize: 13, fontWeight: FontWeight.semibold, color: Colors.primary },
  deleteBtn:       { paddingHorizontal: 16, padding: 10, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  deleteBtnText:   { fontSize: 13, color: Colors.textSecondary },

  addBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', marginTop: Spacing.sm },
  addBtnIcon:      { fontSize: 18, color: Colors.textSecondary },
  addBtnText:      { fontSize: 15, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  overlay:         { flex: 1, justifyContent: 'flex-end' },
  backdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:           { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  handle:          { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.xl },
  sheetTitle:      { fontSize: 18, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel:      { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: Spacing.md },
  input:           { backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: 15, color: Colors.textPrimary },
  iconChip:        { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border },
  iconChipActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  colorRow:        { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  colorDot:        { width: 30, height: 30, borderRadius: 15 },
  colorDotActive:  { borderWidth: 3, borderColor: Colors.dark },
});
