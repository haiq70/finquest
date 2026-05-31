import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenBackground, GlassCard } from '../src/components/Glass';
import { CHARACTERS, getCharacter, tierFromAffection } from '../src/characters';
import { useStore } from '../src/store/useStore';
import { playTap } from '../src/utils/sound';

const P = {
  text: '#3b0764',
  textSecondary: '#7e22ce',
  textMuted: '#a78bfa',
  accentDeep: '#7c3aed',
};

export default function CharactersScreen() {
  const activeId        = useStore(s => s.activeCharacterId);
  const unlockedIds     = useStore(s => s.unlockedCharacterIds);
  const companions      = useStore(s => s.companions);
  const liveAffection   = useStore(s => s.affection);
  const setActive       = useStore(s => s.setActiveCharacter);

  // For the active character the live affection is authoritative; for the
  // rest, read from the saved companions map.
  const affectionFor = (id: string) =>
    id === activeId ? liveAffection : (companions[id as keyof typeof companions]?.affection ?? 0);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => { playTap(); router.back(); }} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={P.accentDeep} />
          </Pressable>
          <Text style={styles.headerTitle}>Companions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.hint}>
            Choose who you're building a relationship with. Only the selected companion's
            affection grows as you save — switch anytime, their progress is kept.
          </Text>

          {CHARACTERS.map(c => {
            const unlocked = unlockedIds.includes(c.id);
            const isActive = c.id === activeId;
            const affection = affectionFor(c.id);
            const tier = tierFromAffection(affection);

            return (
              <Pressable
                key={c.id}
                disabled={!unlocked || isActive}
                onPress={() => { playTap(); setActive(c.id); }}
                style={({ pressed }) => [pressed && unlocked && !isActive && { opacity: 0.85 }]}
              >
                <GlassCard
                  variant={isActive ? 'strong' : 'light'}
                  style={[styles.card, isActive && { borderColor: c.accent }] as any}
                  noPadding
                >
                  <View style={styles.cardInner}>
                    {/* Portrait */}
                    <View style={[styles.portraitWrap, { borderColor: c.accent + '55' }]}>
                      <Image
                        source={c.portraits.neutral}
                        style={[styles.portrait, !unlocked && styles.portraitLocked]}
                        resizeMode="cover"
                      />
                      {!unlocked && (
                        <View style={styles.lockOverlay}>
                          <Ionicons name="lock-closed" size={26} color="#fff" />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{unlocked ? c.name : '???'}</Text>
                        {isActive && (
                          <View style={[styles.activeBadge, { backgroundColor: c.accent }]}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>

                      {unlocked ? (
                        <>
                          <Text style={styles.blurb} numberOfLines={3}>{c.blurb}</Text>
                          <View style={styles.tierRow}>
                            <View style={[styles.tierDot, { backgroundColor: tier.accent }]} />
                            <Text style={styles.tierText}>{tier.label} · {affection}/100</Text>
                          </View>
                          {/* Affection bar */}
                          <View style={styles.affTrack}>
                            <View style={[styles.affFill, { width: `${affection}%`, backgroundColor: c.accent }]} />
                          </View>
                        </>
                      ) : (
                        <Text style={styles.lockedHint}>
                          Locked — keep growing your bond with Kasumi to meet her.
                        </Text>
                      )}

                      {unlocked && !isActive && (
                        <View style={[styles.selectChip, { backgroundColor: c.accent }]}>
                          <Text style={styles.selectChipText}>Tap to select</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  scroll: { padding: 16, paddingTop: 4 },
  hint: { fontSize: 12.5, color: P.textSecondary, lineHeight: 18, marginBottom: 16, marginHorizontal: 2 },

  card: { marginBottom: 14 },
  cardInner: { flexDirection: 'row', padding: 12, gap: 14 },
  portraitWrap: {
    width: 96, height: 128, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2, backgroundColor: '#eee',
  },
  portrait: { width: '100%', height: '100%' },
  portraitLocked: { opacity: 0.35 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(60,20,90,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  info: { flex: 1, justifyContent: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 19, fontWeight: '800', color: P.text },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  blurb: { fontSize: 12.5, color: P.textSecondary, lineHeight: 17, marginBottom: 8 },
  lockedHint: { fontSize: 12.5, color: P.textMuted, lineHeight: 17, fontStyle: 'italic' },

  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierText: { fontSize: 12, color: P.textSecondary, fontWeight: '700' },
  affTrack: { height: 7, backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 4, overflow: 'hidden' },
  affFill: { height: '100%', borderRadius: 4 },

  selectChip: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  selectChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
