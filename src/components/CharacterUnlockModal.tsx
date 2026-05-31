import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCharacter, type CharacterId, type Mood } from '../characters';
import { useStore } from '../store/useStore';
import { playTap } from '../utils/sound';

// ────────────────────────────────────────────────────────────────────
// Story popups. Two flavors share this component:
//   1. First-launch INTRO — sets up the premise + introduces Kasumi.
//   2. Character UNLOCK — when a new companion (e.g. Mira) becomes available.
// Mounted once at the root so either can appear over any screen.
// ────────────────────────────────────────────────────────────────────

interface PopupCopy {
  characterId: CharacterId;
  portraitMood: Mood;
  eyebrow: string;
  title: string;
  lines: string[];
  primaryLabel: string;
  // What the primary button does after closing.
  primaryAction: 'dismiss' | 'open_characters';
}

// First-launch intro — premise setup, playful/meta roommate framing.
const INTRO_COPY: PopupCopy = {
  characterId: 'kasumi',
  portraitMood: 'happy',
  eyebrow: 'New place. New start.',
  title: 'Welcome home',
  lines: [
    "So — you've officially moved in. Boxes everywhere, fridge empty, and rent due sooner than either of us would like.",
    "I'm Kasumi, your roommate. I'm good with money; you, apparently, downloaded an app about it. We'll make it work.",
    "Here's the deal: log what comes in and what goes out, and I'll help you keep this place afloat. Think of me as the one who notices when the grocery budget mysteriously becomes a takeout budget.",
    "Let's build something steady together. Welcome home.",
  ],
  primaryLabel: "Let's get started",
  primaryAction: 'dismiss',
};

// Per-character unlock copy (premise-aware: they're roommates).
const UNLOCK_COPY: Record<string, PopupCopy> = {
  mira: {
    characterId: 'mira',
    portraitMood: 'happy',
    eyebrow: 'The apartment just got louder…',
    title: 'Mira moved in!',
    lines: [
      "Ugh, FINALLY. Kasumi said you were 'ready.' Ready for what, a personality? Rude. Anyway.",
      "I'm Mira. The other roommate. I don't do the gentle-encouragement thing — I tell you you're broke and then help you fix it. You're welcome in advance.",
      "Pick whichever one of us you want to deal with. Soft and supportive, or me. Obviously pick me.",
    ],
    primaryLabel: 'Meet Mira',
    primaryAction: 'open_characters',
  },
};

export function CharacterUnlockModal() {
  const pendingId    = useStore(s => s.pendingCharacterUnlock);
  const hasSeenIntro = useStore(s => s.hasSeenIntro);
  const clearPending = useStore(s => s.clearPendingCharacterUnlock);
  const markIntroSeen = useStore(s => s.markIntroSeen);
  const setActive    = useStore(s => s.setActiveCharacter);

  // Intro takes priority on first launch; otherwise show any pending unlock.
  const mode: 'intro' | 'unlock' | null =
    !hasSeenIntro ? 'intro' : (pendingId ? 'unlock' : null);

  const copy: PopupCopy | null =
    mode === 'intro' ? INTRO_COPY
    : mode === 'unlock' && pendingId ? (UNLOCK_COPY[pendingId] ?? null)
    : null;

  if (!copy) {
    // Keep a stable (invisible) Modal so hook order never changes.
    return <Modal visible={false} transparent />;
  }

  const char = getCharacter(copy.characterId);

  const close = () => {
    if (mode === 'intro') markIntroSeen();
    else clearPending();
  };

  const onPrimary = () => {
    playTap();
    if (copy.primaryAction === 'open_characters') {
      if (pendingId) setActive(pendingId);
      close();
      router.push('/characters');
    } else {
      close();
    }
  };

  const onSecondary = () => { playTap(); close(); };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.portraitWrap, { borderColor: char.accent }]}>
            <Image source={char.portraits[copy.portraitMood]} style={styles.portrait} resizeMode="cover" />
          </View>

          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={[styles.name, { color: char.accent }]}>{copy.title}</Text>

          <View style={styles.lines}>
            {copy.lines.map((l, i) => (
              <Text key={i} style={styles.line}>{l}</Text>
            ))}
          </View>

          <Pressable style={[styles.primaryBtn, { backgroundColor: char.accent }]} onPress={onPrimary}>
            <Text style={styles.primaryText}>{copy.primaryLabel}</Text>
          </Pressable>
          {/* Secondary "later" only makes sense for the unlock, not the intro. */}
          {mode === 'unlock' && (
            <Pressable style={styles.secondaryBtn} onPress={onSecondary}>
              <Text style={styles.secondaryText}>Maybe later</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(40,12,60,0.72)',
    alignItems: 'center', justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%', maxWidth: 380,
    backgroundColor: '#fdf9ff',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#4c1d95', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 16,
  },
  portraitWrap: {
    width: 130, height: 168, borderRadius: 18, overflow: 'hidden',
    borderWidth: 3, marginBottom: 16, marginTop: 4, backgroundColor: '#eee',
  },
  portrait: { width: '100%', height: '100%' },
  eyebrow: { fontSize: 12.5, color: '#a78bfa', fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 14, textAlign: 'center' },
  lines: { gap: 10, marginBottom: 22 },
  line: { fontSize: 14.5, color: '#3b0764', lineHeight: 21, textAlign: 'center' },
  primaryBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginBottom: 8,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { width: '100%', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  secondaryText: { color: '#7e22ce', fontSize: 14, fontWeight: '600' },
});
