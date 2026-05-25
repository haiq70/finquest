// ────────────────────────────────────────────────────────────────────
// Sound settings — persisted user preferences for audio.
//
// Kept in its own small store (separate from the big game store) so the
// settings screen can read/write without pulling in game state. On every
// change it pushes the new values into the audio engine in src/utils/sound.
// ────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  setMusicEnabled,
  setMusicVolume,
  setSfxEnabled,
  setSfxVolume,
  startMusic,
  stopMusic,
} from '../utils/sound';

interface SoundSettingsState {
  sfxEnabled: boolean;
  sfxVolume: number;     // 0..1
  musicEnabled: boolean;
  musicVolume: number;   // 0..1

  setSfxEnabled: (on: boolean) => void;
  setSfxVolume: (v: number) => void;
  setMusicEnabled: (on: boolean) => void;
  setMusicVolume: (v: number) => void;

  /** Push all current settings into the audio engine (call on app start). */
  applyToEngine: () => void;
}

export const useSoundSettings = create<SoundSettingsState>()(
  persist(
    (set, get) => ({
      sfxEnabled: true,
      sfxVolume: 1.0,
      musicEnabled: true,
      musicVolume: 0.5,

      setSfxEnabled(on) {
        set({ sfxEnabled: on });
        setSfxEnabled(on);
      },
      setSfxVolume(v) {
        set({ sfxVolume: v });
        setSfxVolume(v);
      },
      setMusicEnabled(on) {
        set({ musicEnabled: on });
        setMusicEnabled(on);
        if (on) startMusic(); else stopMusic();
      },
      setMusicVolume(v) {
        set({ musicVolume: v });
        setMusicVolume(v);
      },

      applyToEngine() {
        const s = get();
        setSfxEnabled(s.sfxEnabled);
        setSfxVolume(s.sfxVolume);
        setMusicVolume(s.musicVolume);
        setMusicEnabled(s.musicEnabled);
        if (s.musicEnabled) startMusic();
      },
    }),
    {
      name: 'sound-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
