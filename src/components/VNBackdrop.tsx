import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Glass, FontWeight, Radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

// Backdrop height — roughly the top 45% of a typical phone, clamped so it
// looks right on very tall or very short screens.
export const VN_BACKDROP_HEIGHT = Math.min(Math.max(SCREEN_W * 1.0, 320), 460);

interface VNBackdropProps {
  source: ImageSourcePropType;
  /** Kasumi's current line, shown VN-style over the lower portion. */
  line?: string;
  /** Speaker name shown above the line. */
  speaker?: string;
  /** Optional status sub-line (e.g. greeting · level · streak), shown
   *  under a divider inside the dialogue box. */
  status?: string;
  /** Tier label / mood chip text shown top-left. */
  badge?: string;
  badgeColor?: string;
}

/**
 * The character backdrop for the VN home hub. Renders the portrait
 * filling the top of the screen, fading at the bottom into the room
 * gradient so the panels below sit cleanly, with a floating dialogue
 * box over the lower third.
 */
export function VNBackdrop({
  source, line, speaker = 'Kasumi', status, badge, badgeColor = '#a855f7',
}: VNBackdropProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.portraitBox}>
        <Image source={source} style={styles.portrait} resizeMode="cover" />

        {/* Fade the bottom of the portrait into the page gradient */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(232,221,245,0.6)', '#e9d5f0']}
          locations={[0, 0.45, 0.78, 1]}
          style={styles.fade}
        />

        {/* Soft top vignette so the status bar / badge stays legible */}
        <LinearGradient
          colors={['rgba(60,20,80,0.35)', 'transparent']}
          locations={[0, 0.4]}
          style={styles.topVignette}
        />

        {/* Mood / tier badge, top-left */}
        {badge ? (
          <View style={[styles.badge, { borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Dialogue box — overlaps the faded base of the portrait, in flow
          so it never collides with the panels below it. */}
      {line ? (
        <View style={styles.dialogueWrap}>
          <View style={styles.dialogue}>
            <Text style={styles.speaker}>{speaker} ♡</Text>
            <Text style={styles.line}>{line}</Text>
            {status ? (
              <>
                <View style={styles.statusDivider} />
                <Text style={styles.status}>{status}</Text>
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  portraitBox: {
    width: '100%',
    height: VN_BACKDROP_HEIGHT,
    position: 'relative',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
  fade: {
    ...StyleSheet.absoluteFillObject,
  },
  topVignette: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 120,
  },
  badge: {
    position: 'absolute',
    top: 14, left: 16,
    backgroundColor: 'rgba(76,29,149,0.55)',
    borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

  dialogueWrap: {
    marginTop: -56,        // overlap up onto the faded base of the portrait
    marginHorizontal: 14,
  },
  dialogue: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    ...Glass.glow,
  },
  speaker: { fontSize: 12, fontWeight: FontWeight.bold, color: '#7c3aed', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  line: { fontSize: 15, color: '#3b0764', lineHeight: 22 },
  statusDivider: { height: 1, backgroundColor: 'rgba(124,58,237,0.15)', marginTop: 10, marginBottom: 8 },
  status: { fontSize: 12.5, color: '#7e22ce', fontWeight: FontWeight.semibold, lineHeight: 18 },
});
