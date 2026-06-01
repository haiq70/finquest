import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useStore } from '../src/store/useStore';
import { getCharacter } from '../src/characters';
import { playTap } from '../src/utils/sound';

const P = {
  bg: '#faf5ff',
  card: '#ffffff',
  border: '#ede9fe',
  text: '#3b0764',
  textSecondary: '#7e22ce',
  textMuted: '#a78bfa',
  accent: '#a855f7',
  accentDeep: '#7c3aed',
  pink: '#ec4899',
  danger: '#ef4444',
};

// A single labelled action button.
function DebugButton({
  label, onPress, tone = 'default',
}: { label: string; onPress: () => void; tone?: 'default' | 'danger' }) {
  return (
    <Pressable
      onPress={() => { playTap(); onPress(); }}
      style={({ pressed }) => [
        styles.btn,
        tone === 'danger' && styles.btnDanger,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.btnText, tone === 'danger' && styles.btnTextDanger]}>{label}</Text>
    </Pressable>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export default function DebugScreen() {
  // Progression snapshot
  const xp           = useStore(s => s.xp);
  const coins        = useStore(s => s.coins);
  const streak       = useStore(s => s.streak);
  const savingStreak = useStore(s => s.savingStreak);
  const affection    = useStore(s => s.affection);
  const getLevel     = useStore(s => s.getLevel);
  const getTier      = useStore(s => s.getTier);
  const activeCharId = useStore(s => s.activeCharacterId);

  // Debug actions
  const debugAddXp                = useStore(s => s.debugAddXp);
  const debugAddCoins             = useStore(s => s.debugAddCoins);
  const debugSetStreak            = useStore(s => s.debugSetStreak);
  const debugSetSavingStreak      = useStore(s => s.debugSetSavingStreak);
  const debugAddAffection         = useStore(s => s.debugAddAffection);
  const debugUnlockAllCharacters  = useStore(s => s.debugUnlockAllCharacters);
  const debugUnlockAllAchievements= useStore(s => s.debugUnlockAllAchievements);
  const debugGrantAllItems        = useStore(s => s.debugGrantAllItems);
  const debugActivateBoosts       = useStore(s => s.debugActivateBoosts);
  const debugResetCoinCap         = useStore(s => s.debugResetCoinCap);
  const debugResetProgress        = useStore(s => s.debugResetProgress);

  const confirmReset = () => {
    Alert.alert(
      'Reset all progress?',
      'Wipes transactions, XP, coins, streaks, achievements, items and relationships back to a fresh save. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => debugResetProgress() },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { playTap(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={P.accentDeep} />
        </Pressable>
        <Text style={styles.headerTitle}>Debug tools</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.warn}>
          ⚠️ Developer cheats — these bypass the normal earning flow. For testing only.
        </Text>

        {/* Live snapshot */}
        <Text style={styles.sectionLabel}>CURRENT STATE</Text>
        <View style={styles.chipRow}>
          <StatChip label="Level" value={getLevel()} />
          <StatChip label="XP" value={xp} />
          <StatChip label="Coins" value={coins} />
        </View>
        <View style={styles.chipRow}>
          <StatChip label="Streak" value={`${streak}d`} />
          <StatChip label="Saving" value={`${savingStreak}d`} />
          <StatChip label="Affection" value={affection} />
        </View>
        <Text style={styles.hint}>
          {getCharacter(activeCharId).name} · {getTier().label}
        </Text>

        {/* XP & Level */}
        <Text style={styles.sectionLabel}>XP & LEVEL</Text>
        <View style={styles.card}>
          <DebugButton label="+100 XP" onPress={() => debugAddXp(100)} />
          <DebugButton label="+500 XP" onPress={() => debugAddXp(500)} />
          <DebugButton label="+1 Level (XP)" onPress={() => debugAddXp(1000)} />
        </View>

        {/* Coins & Shop */}
        <Text style={styles.sectionLabel}>COINS & SHOP</Text>
        <View style={styles.card}>
          <DebugButton label="+500 FC" onPress={() => debugAddCoins(500)} />
          <DebugButton label="+5,000 FC" onPress={() => debugAddCoins(5000)} />
          <DebugButton label="Grant all shop items" onPress={() => debugGrantAllItems()} />
          <DebugButton label="Activate XP + Coin boosts (24h)" onPress={() => debugActivateBoosts()} />
          <DebugButton label="Reset daily coin cap" onPress={() => debugResetCoinCap()} />
        </View>

        {/* Streaks */}
        <Text style={styles.sectionLabel}>STREAKS</Text>
        <View style={styles.card}>
          <DebugButton label="Set activity streak → 7" onPress={() => debugSetStreak(7)} />
          <DebugButton label="Set activity streak → 30" onPress={() => debugSetStreak(30)} />
          <DebugButton label="Set saving streak → 3 (unlock multipliers)" onPress={() => debugSetSavingStreak(3)} />
          <DebugButton label="Set saving streak → 14" onPress={() => debugSetSavingStreak(14)} />
        </View>

        {/* Relationship */}
        <Text style={styles.sectionLabel}>RELATIONSHIP</Text>
        <View style={styles.card}>
          <DebugButton label="+20 Affection (next tier)" onPress={() => debugAddAffection(20)} />
          <DebugButton label="Max out affection (Soulmate)" onPress={() => debugAddAffection(100)} />
          <DebugButton label="Unlock all characters" onPress={() => debugUnlockAllCharacters()} />
        </View>

        {/* Achievements */}
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        <View style={styles.card}>
          <DebugButton label="Unlock all achievements" onPress={() => debugUnlockAllAchievements()} />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <View style={styles.card}>
          <DebugButton label="Reset all progress" tone="danger" onPress={confirmReset} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: P.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  scroll: { padding: 16, paddingBottom: 40 },

  warn: {
    fontSize: 12, color: '#92400e', backgroundColor: '#fef3c7',
    borderRadius: 12, padding: 12, lineHeight: 17, marginBottom: 8,
    borderWidth: 1, borderColor: '#fde68a',
  },

  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: P.textSecondary,
    letterSpacing: 0.6, marginBottom: 8, marginTop: 12, marginLeft: 4,
  },
  card: {
    backgroundColor: P.card, borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: P.border, marginBottom: 8, gap: 8,
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    flex: 1, backgroundColor: P.card, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: P.border,
  },
  chipValue: { fontSize: 18, fontWeight: '800', color: P.accentDeep },
  chipLabel: { fontSize: 11, color: P.textMuted, marginTop: 2, fontWeight: '600' },

  btn: {
    backgroundColor: '#f3e8ff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnDanger: { backgroundColor: '#fee2e2' },
  btnText: { fontSize: 14, fontWeight: '700', color: P.accentDeep },
  btnTextDanger: { color: P.danger },

  hint: { fontSize: 12, color: P.textMuted, lineHeight: 17, marginTop: 2, marginLeft: 4 },
});
