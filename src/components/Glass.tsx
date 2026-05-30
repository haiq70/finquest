import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Glass, Radius } from '../theme';

// ────────────────────────────────────────────────────────────────────
// ScreenBackground
//
// The shared "room" backdrop every screen sits on. A soft dusk gradient
// with the patterned wallpaper faintly overlaid and a couple of floating
// sparkles, so all screens share one cohesive scene and the glass panels
// have something to float over.
// ────────────────────────────────────────────────────────────────────
const BG_PATTERN = require('../../assets/images/ui/bg-pattern.png');
const SPARKLE = require('../../assets/images/ui/sparkle.png');
const DOT = require('../../assets/images/ui/dot.png');

export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={Glass.bgGradientDusk as unknown as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Faint wallpaper texture over the gradient */}
      <ImageBackground
        source={BG_PATTERN}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.35 }}
      />
      {/* Ambient floating sparkles */}
      <Image source={SPARKLE} style={[styles.spark, { top: 70, right: 26, width: 26, height: 26, opacity: 0.5 }]} />
      <Image source={DOT} style={[styles.spark, { top: 150, left: 22, width: 14, height: 14, opacity: 0.4 }]} />
      <Image source={SPARKLE} style={[styles.spark, { bottom: 120, left: 30, width: 16, height: 16, opacity: 0.35 }]} />
      {children}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// GlassCard
//
// A frosted translucent panel. Uses expo-blur for real glass on iOS;
// on Android (SDK 54) BlurView falls back to a translucent fill, which
// still reads as glass thanks to the layered fill + bright border.
// ────────────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** 'light' standard, 'strong' for more contrast, 'dark' purple-tinted. */
  variant?: 'light' | 'strong' | 'dark';
  intensity?: number;
  /** Disable the inner padding (e.g. for list rows). */
  noPadding?: boolean;
}

export function GlassCard({
  children, style, variant = 'light', intensity, noPadding,
}: GlassCardProps) {
  const fill =
    variant === 'strong' ? Glass.fillStrong
    : variant === 'dark' ? Glass.fillDark
    : Glass.fill;
  const border = variant === 'dark' ? 'rgba(255,255,255,0.25)' : Glass.border;

  return (
    <View style={[styles.cardWrap, Glass.glow, style]}>
      <BlurView
        intensity={intensity ?? Glass.intensity}
        tint={variant === 'dark' ? 'dark' : Glass.tint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {/* Bright top-edge highlight that sells the glass */}
      <View style={[styles.topEdge, { backgroundColor: border }]} />
      <View style={[styles.inner, noPadding && { padding: 0 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ede9fe' },
  spark: { position: 'absolute' },

  cardWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Glass.borderSoft,
  },
  topEdge: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  inner: { padding: 16 },
});
