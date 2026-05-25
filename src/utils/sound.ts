// ────────────────────────────────────────────────────────────────────
// Audio: UI sound effects + looping background music.
//
// Thin wrapper around expo-audio. Two independent channels:
//   • SFX   — short taps/clicks on button presses (playTap)
//   • Music — a gentle looping background track (startMusic/stopMusic)
//
// Each channel has its own enabled flag and volume. All calls are
// best-effort: if audio fails to load (simulator, web, silent mode),
// they're silently ignored so they never break the UI.
// ────────────────────────────────────────────────────────────────────

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const TAP_SOURCE = require('../../assets/sounds/tap.mp3');
const BGM_SOURCE = require('../../assets/sounds/bgm.mp3');

let tapPlayer: AudioPlayer | null = null;
let bgmPlayer: AudioPlayer | null = null;
let initialized = false;

let sfxEnabled = true;
let sfxVolume = 1.0;
let musicEnabled = true;
let musicVolume = 0.5;
let musicShouldPlay = false;

/** Preload both players. Safe to call multiple times. */
export function initSounds() {
  if (initialized) return;
  initialized = true;
  try {
    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    }).catch(() => {});

    tapPlayer = createAudioPlayer(TAP_SOURCE);
    tapPlayer.volume = sfxVolume;

    bgmPlayer = createAudioPlayer(BGM_SOURCE);
    bgmPlayer.loop = true;
    bgmPlayer.volume = musicVolume;
  } catch {
    tapPlayer = null;
    bgmPlayer = null;
  }
}

// ── SFX ─────────────────────────────────────────────────────────────

export function setSfxEnabled(on: boolean) {
  sfxEnabled = on;
}

export function setSfxVolume(v: number) {
  sfxVolume = Math.max(0, Math.min(1, v));
  try { if (tapPlayer) tapPlayer.volume = sfxVolume; } catch {}
}

/** Play the soft tap/click. Safe to call anywhere; never throws. */
export function playTap() {
  if (!sfxEnabled) return;
  try {
    if (!tapPlayer) {
      initSounds();
      if (!tapPlayer) return;
    }
    tapPlayer.seekTo(0);
    tapPlayer.play();
  } catch {
    // non-essential feedback — ignore
  }
}

// ── Background music ────────────────────────────────────────────────

export function setMusicVolume(v: number) {
  musicVolume = Math.max(0, Math.min(1, v));
  try { if (bgmPlayer) bgmPlayer.volume = musicVolume; } catch {}
}

/** Enable/disable music; resumes or pauses without losing position. */
export function setMusicEnabled(on: boolean) {
  musicEnabled = on;
  try {
    if (!bgmPlayer) { initSounds(); }
    if (!bgmPlayer) return;
    if (on && musicShouldPlay) {
      bgmPlayer.play();
    } else {
      bgmPlayer.pause();
    }
  } catch {}
}

/** Begin looping background music (respects the enabled flag). */
export function startMusic() {
  musicShouldPlay = true;
  if (!musicEnabled) return;
  try {
    if (!bgmPlayer) {
      initSounds();
      if (!bgmPlayer) return;
    }
    bgmPlayer.loop = true;
    bgmPlayer.volume = musicVolume;
    bgmPlayer.play();
  } catch {}
}

/** Stop background music entirely. */
export function stopMusic() {
  musicShouldPlay = false;
  try {
    if (bgmPlayer) {
      bgmPlayer.pause();
      bgmPlayer.seekTo(0);
    }
  } catch {}
}
