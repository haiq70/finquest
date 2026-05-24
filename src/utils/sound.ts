// ────────────────────────────────────────────────────────────────────
// UI sound effects.
//
// Thin wrapper around expo-audio so the rest of the app can just call
// playTap() on a button press without managing players. We keep a
// single preloaded player and replay it — cheap and low-latency.
//
// Sounds are best-effort: if audio fails to load (simulator, silent
// mode, web), calls are silently ignored so they never break a tap.
// ────────────────────────────────────────────────────────────────────

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let tapPlayer: AudioPlayer | null = null;
let enabled = true;
let initialized = false;

const TAP_SOURCE = require('../../assets/sounds/tap.mp3');

/**
 * Preload the sound players. Call once at app start (safe to call again).
 */
export function initSounds() {
  if (initialized) return;
  initialized = true;
  try {
    // Allow playback even when the iOS ringer switch is on silent —
    // UI feedback sounds are expected to be quiet but present. We keep
    // this non-mixing-hostile so other audio (music) isn't interrupted.
    setAudioModeAsync({
      playsInSilentMode: false,   // respect the user's silent switch
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
    tapPlayer = createAudioPlayer(TAP_SOURCE);
  } catch {
    tapPlayer = null;
  }
}

/** Enable/disable all UI sounds (wire to a settings toggle later). */
export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

/** Play the soft tap/click. Safe to call anywhere; never throws. */
export function playTap() {
  if (!enabled) return;
  try {
    if (!tapPlayer) {
      // Lazy init fallback if initSounds wasn't called.
      initSounds();
      if (!tapPlayer) return;
    }
    tapPlayer.seekTo(0);
    tapPlayer.play();
  } catch {
    // ignore — sound is non-essential feedback
  }
}
