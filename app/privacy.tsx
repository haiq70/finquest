import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenBackground, GlassCard } from '../src/components/Glass';
import { playTap } from '../src/utils/sound';

const P = {
  text: '#3b0764',
  textSecondary: '#7e22ce',
  textMuted: '#a78bfa',
  accentDeep: '#7c3aed',
};

// Update this whenever the policy text changes.
const LAST_UPDATED = 'May 31, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export default function PrivacyScreen() {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => { playTap(); router.back(); }} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={P.accentDeep} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard variant="strong" style={styles.card}>
            <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

            <Body>
              FinQuest ("the app," "we," "us") is a personal-finance companion app. This
              policy explains how the app handles your information. In short: your data
              stays on your device. We don't collect it, we can't see it, and we don't
              send it anywhere.
            </Body>

            <Section title="The short version">
              <Body>
                • FinQuest stores everything you enter locally on your device only.{'\n'}
                • We do not operate servers that receive your data.{'\n'}
                • We do not require an account, email, or login.{'\n'}
                • We do not use analytics, advertising, or third-party trackers.{'\n'}
                • We have no ability to access, view, or recover your data.
              </Body>
            </Section>

            <Section title="Information stored on your device">
              <Body>
                Everything you create in FinQuest is saved in your device's local app
                storage so the app remembers it between sessions. This includes the
                financial entries you log (amounts, whether they're income or expenses,
                categories, and dates), the savings goals you set, your progress (XP,
                levels, streaks, achievements), your in-app currency and items, your
                companion relationship progress, and your app preferences such as sound
                settings.
              </Body>
              <Body>
                This information never leaves your device. It is not transmitted to us or
                to anyone else.
              </Body>
            </Section>

            <Section title="Information we collect">
              <Body>
                None. FinQuest does not collect personal information. The app has no
                backend server, no user accounts, and makes no network requests to send
                your data anywhere. Because we never receive your information, we cannot
                read, share, sell, or lose it.
              </Body>
            </Section>

            <Section title="Third parties">
              <Body>
                FinQuest does not currently integrate analytics, advertising networks,
                crash-reporting services, or other third-party SDKs that would collect
                data about you. The app is distributed through the Apple App Store; your
                use of the App Store is governed by Apple's own privacy policy, which we
                don't control.
              </Body>
            </Section>

            <Section title="Deleting your data">
              <Body>
                Because your data lives only on your device, you are always in control of
                it. You can remove all FinQuest data at any time by deleting the app, or
                by clearing the app's data through your device settings. Once deleted, the
                data is gone — we keep no copy because we never had one.
              </Body>
            </Section>

            <Section title="Children's privacy">
              <Body>
                FinQuest is not directed to children under 13, and we do not knowingly
                collect information from anyone. Since no information is collected or
                transmitted, no personal data about any user — including children — is
                gathered by the app.
              </Body>
            </Section>

            <Section title="Changes to this policy">
              <Body>
                If FinQuest adds features in the future that involve collecting or
                transmitting data — for example, optional cloud backup, accounts, or
                analytics — we will update this policy to describe what is collected, why,
                and your choices, and we will revise the "last updated" date above before
                those features take effect. Continued use of the app after such changes
                indicates acceptance of the updated policy.
              </Body>
            </Section>

            <Section title="Contact">
              <Body>
                If you have questions about this policy, contact us at{' '}
                <Text style={styles.email}>privacy@finquest.app</Text>.
              </Body>
            </Section>

            <Text style={styles.disclaimer}>
              This policy describes the app's data practices as of the date above. It is
              provided for transparency and is not legal advice.
            </Text>
          </GlassCard>

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
  card: { padding: 20 },

  updated: { fontSize: 12.5, color: P.textMuted, fontWeight: '600', marginBottom: 16 },
  section: { marginTop: 18 },
  h2: { fontSize: 16, fontWeight: '800', color: P.text, marginBottom: 8 },
  body: { fontSize: 14, color: P.textSecondary, lineHeight: 22, marginBottom: 10 },
  email: { color: P.accentDeep, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: P.textMuted, fontStyle: 'italic', lineHeight: 18, marginTop: 22 },
});
