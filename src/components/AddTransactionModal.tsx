import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Colors, Spacing, Radius, FontWeight, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Category } from '../theme';
import { useStore, type TxType } from '../store/useStore';
import { PrimaryButton } from './index';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ visible, onClose }: Props) {
  const addTransaction = useStore(s => s.addTransaction);

  const [txType, setTxType]       = useState<TxType>('expense');
  const [amount, setAmount]       = useState('');
  const [description, setDesc]    = useState('');
  const [category, setCategory]   = useState<Category>('🍔 Food');

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = useCallback((t: TxType) => {
    setTxType(t);
    setCategory(t === 'income' ? '💼 Salary' : '🍔 Food');
  }, []);

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a short description.');
      return;
    }
    addTransaction({ type: txType, amount: parsed, description: description.trim(), category });
    setAmount('');
    setDesc('');
    setTxType('expense');
    setCategory('🍔 Food');
    onClose();
  }, [amount, description, txType, category, addTransaction, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Log transaction</Text>

          {/* Type toggle */}
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, txType === 'expense' && styles.typeBtnExpActive]}
              onPress={() => handleTypeSwitch('expense')}
            >
              <Text style={[styles.typeBtnText, txType === 'expense' && styles.typeBtnTextExpActive]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, txType === 'income' && styles.typeBtnIncActive]}
              onPress={() => handleTypeSwitch('income')}
            >
              <Text style={[styles.typeBtnText, txType === 'income' && styles.typeBtnTextIncActive]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={styles.fieldLabel}>Amount (€)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />

          {/* Description */}
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDesc}
            placeholder="e.g. Grocery run"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <PrimaryButton
            label={`Add transaction  ·  +20 XP`}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:      { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  handle:     { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.xl },
  title:      { fontSize: 18, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: Spacing.md },
  input:      { backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: 15, color: Colors.textPrimary },
  typeRow:    { flexDirection: 'row', gap: Spacing.sm },
  typeBtn:    { flex: 1, padding: 11, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.background },
  typeBtnExpActive:     { backgroundColor: Colors.expenseLight, borderColor: Colors.expense },
  typeBtnIncActive:     { backgroundColor: Colors.incomeLight, borderColor: Colors.income },
  typeBtnText:          { fontSize: 14, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  typeBtnTextExpActive: { color: '#dc2626' },
  typeBtnTextIncActive: { color: '#15803d' },
  catScroll:  { marginBottom: 4 },
  catRow:     { gap: Spacing.sm, paddingBottom: 4 },
  catChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background },
  catChipActive:     { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catChipText:       { fontSize: 13, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  submitBtn:  { marginTop: Spacing.lg },
});
