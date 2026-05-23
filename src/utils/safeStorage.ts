/**
 * safeStorage.ts
 *
 * Wraps @react-native-async-storage/async-storage so that:
 *   1. The native-module-null crash (common in Expo Go and New Arch first
 *      launch) is caught and handled instead of crashing the whole app.
 *   2. Every individual getItem / setItem / removeItem is wrapped in
 *      try/catch so a corrupt key never takes the whole store down.
 *   3. If the native module is genuinely unavailable, an in-memory
 *      Map is used as a fallback so the app stays functional (data
 *      won't survive a restart, but nothing crashes).
 *
 * Usage (drop-in for createJSONStorage):
 *
 *   import { safeStorage } from '../utils/safeStorage';
 *
 *   persist(..., {
 *     storage: safeStorage,
 *   })
 */

import type { StateStorage } from 'zustand/middleware';

// Attempt to load AsyncStorage — if the native module is null this
// module-level require() will throw, which we catch here.
let _asyncStorage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
} | null = null;

let _usingFallback = false;

try {
  // Dynamic require so that a module-level throw doesn't crash the bundle.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-async-storage/async-storage');
  _asyncStorage = mod.default ?? mod;
} catch (e) {
  console.warn(
    '[safeStorage] AsyncStorage native module unavailable — using in-memory fallback. ' +
    'Data will NOT persist across app restarts.',
    e,
  );
  _usingFallback = true;
}

// In-memory fallback used when the native module is absent.
const _memStore = new Map<string, string>();

// ── Zustand StateStorage-compatible object ──────────────────────────
//
// zustand/middleware persist expects:
//   getItem(name)  → string | null | Promise<string | null>
//   setItem(name, value) → void | Promise<void>
//   removeItem(name) → void | Promise<void>
//
// We always return Promises so the type is consistent.

export const safeStorage: StateStorage = {
  async getItem(name: string): Promise<string | null> {
    if (_usingFallback || !_asyncStorage) {
      return _memStore.get(name) ?? null;
    }
    try {
      const value = await _asyncStorage.getItem(name);
      return value ?? null;
    } catch (e) {
      console.warn(`[safeStorage] getItem failed for key "${name}":`, e);
      // Attempt to recover from the in-memory mirror written on last setItem.
      return _memStore.get(name) ?? null;
    }
  },

  async setItem(name: string, value: string): Promise<void> {
    // Always write to the in-memory mirror first — this is the fallback
    // data source if AsyncStorage fails on the next getItem.
    _memStore.set(name, value);
    if (_usingFallback || !_asyncStorage) return;
    try {
      await _asyncStorage.setItem(name, value);
    } catch (e) {
      console.warn(`[safeStorage] setItem failed for key "${name}":`, e);
      // Data is still in _memStore, so the current session is intact.
    }
  },

  async removeItem(name: string): Promise<void> {
    _memStore.delete(name);
    if (_usingFallback || !_asyncStorage) return;
    try {
      await _asyncStorage.removeItem(name);
    } catch (e) {
      console.warn(`[safeStorage] removeItem failed for key "${name}":`, e);
    }
  },
};

/** True when running without native AsyncStorage (e.g. Expo Go cold start). */
export function isUsingMemoryFallback(): boolean {
  return _usingFallback;
}
