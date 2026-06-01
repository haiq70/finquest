import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/theme';
import { AchievementQueue } from '../src/components/AchievementToast';
import { CharacterUnlockModal } from '../src/components/CharacterUnlockModal';
import { ChoicePromptModal } from '../src/components/ChoicePromptModal';
import { initSounds } from '../src/utils/sound';
import { useSoundSettings } from '../src/store/useSoundSettings';

export default function RootLayout() {
  const applyToEngine = useSoundSettings(s => s.applyToEngine);

  useEffect(() => {
    initSounds();
    // Push persisted prefs into the audio engine and start music if enabled.
    // Slight delay lets the persisted store rehydrate first.
    const t = setTimeout(() => applyToEngine(), 350);
    return () => clearTimeout(t);
  }, [applyToEngine]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="characters" options={{ presentation: 'modal' }} />
          <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
          <Stack.Screen name="debug" options={{ presentation: 'modal' }} />
        </Stack>
        {/* Global achievement toast overlay — renders above all screens */}
        <AchievementQueue />
        {/* New-companion unlock popup — appears over any screen */}
        <CharacterUnlockModal />
        {/* Interactive choice prompts — tier-up + random on income */}
        <ChoicePromptModal />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
