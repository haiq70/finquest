import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Pressable,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { Colors, Spacing, Radius, FontWeight, CategoryMeta, type Category } from '../theme';
import type { Transaction, Goal, LeaderboardEntry } from '../store/useStore';
import { fmtCurrency, fmtDate } from '../utils/format';

// ─────────────────────────────────────────────────────────
// SectionTitle
// ─────────────────────────────────────────────────────────
export function SectionTitle({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[secStyles.title, style]}>{children}</Text>;
}
const secStyles = StyleSheet.create({
  title: {
    fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.7,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
});

// ─────────────────────────────────────────────────────────
// XpBar
// ─────────────────────────────────────────────────────────
interface XpBarProps { xp: number; level: number; xpInLevel: number; xpCap?: number; }
export function XpBar({ xp, level, xpInLevel, xpCap = 500 }: XpBarProps) {
  const pct = Math.min(1, xpInLevel / xpCap);
  return (
    <View style={xpStyles.wrap}>
      <View style={xpStyles.header}>
        <View style={xpStyles.row}>
          <View style={xpStyles.badge}><Text style={xpStyles.badgeText}>Lv {level}</Text></View>
          <Text style={xpStyles.levelName}>Saver</Text>
        </View>
        <Text style={xpStyles.pts}>{xpInLevel} / {xpCap} XP</Text>
      </View>
      <View style={xpStyles.track}>
        <View style={[xpStyles.fill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
    </View>
  );
}
const xpStyles = StyleSheet.create({
  wrap:      { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge:     { backgroundColor: Colors.dark, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.semibold },
  levelName: { fontSize: 13, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  pts:       { fontSize: 12, color: Colors.textSecondary },
  track:     { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.primary },
});

// ─────────────────────────────────────────────────────────
// GoalCard
// ─────────────────────────────────────────────────────────
interface GoalCardProps { goal: Goal; onPress?: () => void; }
export function GoalCard({ goal, onPress }: GoalCardProps) {
  const { icon, name, saved, target, color } = goal;
  const pct = Math.min(1, saved / target);
  return (
    <Pressable style={goalStyles.card} onPress={onPress}>
      <Text style={goalStyles.icon}>{icon}</Text>
      <Text style={goalStyles.name} numberOfLines={1}>{name}</Text>
      <Text style={goalStyles.amt}>{fmtCurrency(saved)} / {fmtCurrency(target)}</Text>
      <View style={goalStyles.track}>
        <View style={[goalStyles.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[goalStyles.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </Pressable>
  );
}
const goalStyles = StyleSheet.create({
  card:  { width: 136, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md, marginRight: Spacing.sm },
  icon:  { fontSize: 22, marginBottom: 8 },
  name:  { fontSize: 13, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 2 },
  amt:   { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  pct:   { fontSize: 11, fontWeight: FontWeight.semibold, marginTop: 6, alignSelf: 'flex-end' },
});

// ─────────────────────────────────────────────────────────
// TransactionItem
// ─────────────────────────────────────────────────────────
interface TxItemProps { item: Transaction; onLongPress?: (id: string) => void; }
export function TransactionItem({ item, onLongPress }: TxItemProps) {
  const isIncome = item.type === 'income';
  const emoji = item.category.split(' ')[0];
  const meta = CategoryMeta[item.category as Category];
  return (
    <Pressable
      style={txStyles.row}
      onLongPress={() => onLongPress?.(item.id)}
      android_ripple={{ color: '#f3f4f6' }}
    >
      <View style={[txStyles.iconWrap, { backgroundColor: meta?.bg ?? '#f8fafc' }]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.desc} numberOfLines={1}>{item.description}</Text>
        <Text style={txStyles.cat}>{item.category} · {fmtDate(item.date)}</Text>
      </View>
      <Text style={[txStyles.amt, { color: isIncome ? Colors.income : Colors.expense }]}>
        {isIncome ? '+' : '-'}{fmtCurrency(item.amount)}
      </Text>
    </Pressable>
  );
}
const txStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  iconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info:     { flex: 1 },
  desc:     { fontSize: 14, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  cat:      { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  amt:      { fontSize: 15, fontWeight: FontWeight.semibold },
});

// ─────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string; sub?: string; accent?: string; style?: ViewStyle; }
export function StatCard({ label, value, sub, accent, style }: StatCardProps) {
  return (
    <View style={[statStyles.card, style]}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, accent ? { color: accent } : null]}>{value}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}
const statStyles = StyleSheet.create({
  card:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  sub:   { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────
// CategoryBar
// ─────────────────────────────────────────────────────────
interface CategoryBarProps { category: Category; amount: number; max: number; }
export function CategoryBar({ category, amount, max }: CategoryBarProps) {
  const pct = Math.min(1, max > 0 ? amount / max : 0);
  const meta = CategoryMeta[category];
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{category}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: meta?.bar ?? '#94a3b8' }]} />
      </View>
      <Text style={barStyles.val}>{fmtCurrency(amount)}</Text>
    </View>
  );
}
const barStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 10 },
  label: { fontSize: 12, color: Colors.textSecondary, width: 88 },
  track: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.full },
  val:   { fontSize: 12, color: Colors.textSecondary, width: 52, textAlign: 'right' },
});

// ─────────────────────────────────────────────────────────
// LeaderboardItem
// ─────────────────────────────────────────────────────────
interface LbItemProps { item: LeaderboardEntry & { rank: number }; }
export function LeaderboardItem({ item }: LbItemProps) {
  const rankColors: Record<number, string> = { 1: Colors.gold, 2: Colors.silver, 3: Colors.bronze };
  const rankColor = rankColors[item.rank] ?? Colors.textMuted;
  return (
    <View style={[lbStyles.row, item.isMe && lbStyles.rowMe]}>
      <Text style={[lbStyles.rank, { color: rankColor }]}>{item.rank}</Text>
      <View style={[lbStyles.avatar, { backgroundColor: item.bg }]}>
        <Text style={[lbStyles.avatarText, { color: item.fg }]}>{item.initials}</Text>
      </View>
      <View style={lbStyles.info}>
        <Text style={lbStyles.name}>{item.name}</Text>
        <Text style={lbStyles.pts}>{item.xp.toLocaleString()} XP · Lv {item.level}</Text>
      </View>
      {item.isMe && (
        <View style={lbStyles.youBadge}><Text style={lbStyles.youText}>YOU</Text></View>
      )}
    </View>
  );
}
const lbStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  rowMe:     { borderColor: Colors.primary, backgroundColor: '#f5f3ff' },
  rank:      { fontSize: 16, fontWeight: FontWeight.bold, width: 24, textAlign: 'center' },
  avatar:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText:{ fontSize: 13, fontWeight: FontWeight.semibold },
  info:      { flex: 1 },
  name:      { fontSize: 14, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  pts:       { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  youBadge:  { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  youText:   { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
});

// ─────────────────────────────────────────────────────────
// PrimaryButton
// ─────────────────────────────────────────────────────────
interface PrimaryButtonProps { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle; }
export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[btnStyles.btn, disabled && btnStyles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={btnStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const btnStyles = StyleSheet.create({
  btn:      { backgroundColor: Colors.dark, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  label:    { color: '#fff', fontSize: 15, fontWeight: FontWeight.semibold },
});

// ─────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.sub}>{sub}</Text>
    </View>
  );
}
const emptyStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 36, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.border, marginHorizontal: Spacing.lg },
  icon:  { fontSize: 36, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  sub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
});
