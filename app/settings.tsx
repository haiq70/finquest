import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSoundSettings } from '../src/store/useSoundSettings';
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
};

// Simple stepper-based volume control (no slider dependency needed).
function VolumeStepper({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const pct = Math.round(value * 100);
  const step = (dir: number) => {
    const next = Math.max(0, Math.min(1, Math.round((value + dir * 0.1) * 10) / 10));
    onChange(next);
    playTap();
  };
  return (
    <View style={[styles.volRow, disabled && { opacity: 0.4 }]}>
      <Pressable
        onPress={() => !disabled && step(-1)}
        style={styles.volBtn}
        hitSlop={8}
      >
        <Ionicons name="remove" size={18} color={P.accentDeep} />
      </Pressable>

      <View style={styles.volTrack}>
        <View style={[styles.volFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.volPct}>{pct}%</Text>

      <Pressable
        onPress={() => !disabled && step(1)}
        style={styles.volBtn}
        hitSlop={8}
      >
        <Ionicons name="add" size={18} color={P.accentDeep} />
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const {
    sfxEnabled, sfxVolume, musicEnabled, musicVolume,
    setSfxEnabled, setSfxVolume, setMusicEnabled, setMusicVolume,
  } = useSoundSettings();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { playTap(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={P.accentDeep} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Sound section */}
        <Text style={styles.sectionLabel}>SOUND</Text>
        <View style={styles.card}>
          {/* Music toggle */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="musical-notes" size={20} color={P.pink} />
              <Text style={styles.rowTitle}>Background music</Text>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={(v) => { setMusicEnabled(v); playTap(); }}
              trackColor={{ false: '#e5e7eb', true: P.accent }}
              thumbColor="#fff"
            />
          </View>
          <VolumeStepper value={musicVolume} onChange={setMusicVolume} disabled={!musicEnabled} />

          <View style={styles.divider} />

          {/* SFX toggle */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="volume-high" size={20} color={P.pink} />
              <Text style={styles.rowTitle}>Sound effects</Text>
            </View>
            <Switch
              value={sfxEnabled}
              onValueChange={(v) => { setSfxEnabled(v); if (v) playTap(); }}
              trackColor={{ false: '#e5e7eb', true: P.accent }}
              thumbColor="#fff"
            />
          </View>
          <VolumeStepper value={sfxVolume} onChange={setSfxVolume} disabled={!sfxEnabled} />
        </View>

        <Text style={styles.hint}>
          Music loops softly while you use the app. Sound effects play on taps and actions.
        </Text>

        {/* About section */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>FinQuest</Text>
            <Text style={styles.rowValue}>v1.1</Text>
          </View>
        </View>
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

  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: P.textSecondary,
    letterSpacing: 0.6, marginBottom: 8, marginTop: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: P.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: P.border, marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: P.text },
  rowValue: { fontSize: 14, color: P.textMuted },
  divider: { height: 1, backgroundColor: P.border, marginVertical: 12 },

  volRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  volBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#f3e8ff',
    alignItems: 'center', justifyContent: 'center',
  },
  volTrack: {
    flex: 1, height: 8, backgroundColor: '#ece4ff', borderRadius: 4, overflow: 'hidden',
  },
  volFill: { height: '100%', backgroundColor: P.accent, borderRadius: 4 },
  volPct: { fontSize: 12, color: P.textSecondary, fontWeight: '700', width: 42, textAlign: 'right' },

  hint: { fontSize: 12, color: P.textMuted, lineHeight: 17, marginTop: 4, marginBottom: 8, marginHorizontal: 4 },
});
