import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

const MESSAGES = [
  "You're doing great today.",
  "Keep turning pages.",
  "Every page makes you wiser.",
  "Reading looks good on you.",
  "One page at a time.",
  "You're building a reading habit.",
  "Small progress is still progress.",
  "Today's reading counts.",
  "Keep the streak alive.",
  "Your future self will thank you.",
  "Books are becoming your superpower.",
  "Every chapter is a step forward.",
  "Nice work, reader.",
  "Stay curious.",
  "Keep going, you're closer than yesterday.",
];

export const ReadingCompanion: React.FC = () => {
  // Select a random message on mount (every app launch)
  const message = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    return MESSAGES[randomIndex];
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Background Decorative Elements (5-12% opacity) ── */}
      {/* Top-Left Soft Blob */}
      <View style={[styles.shape, styles.topLeftBlob]} pointerEvents="none" />

      {/* Top-Right Circle */}
      <View style={[styles.shape, styles.topRightCircle]} pointerEvents="none" />

      {/* Bottom-Left Tiny Dots Cluster */}
      <View style={[styles.dot, styles.dot1]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot2]} pointerEvents="none" />
      <View style={[styles.dot, styles.dot3]} pointerEvents="none" />

      {/* Bottom-Right Thin Line Doodle */}
      <View style={[styles.shape, styles.bottomRightDoodle]} pointerEvents="none" />

      {/* ── Foreground Motivation Text & Leaf Icon ── */}
      <View style={styles.content} pointerEvents="none">
        <Text style={styles.messageText}>{message}</Text>
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Ionicons name="leaf-outline" size={14} color={COLORS.accent} style={styles.leafIcon} />
          <View style={styles.line} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.serif,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: 100,
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.accent,
    opacity: 0.2,
  },
  leafIcon: {
    marginHorizontal: 8,
    opacity: 0.8,
  },

  /* Background shapes with low opacity (5-12%) */
  shape: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
  },
  topLeftBlob: {
    width: 90,
    height: 75,
    borderRadius: 35,
    opacity: 0.06,
    top: 10,
    left: -20,
    transform: [{ rotate: '15deg' }, { scaleX: 1.2 }],
  },
  topRightCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.05,
    top: 30,
    right: -25,
  },
  bottomRightDoodle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    opacity: 0.07,
    bottom: 20,
    right: 25,
    transform: [{ rotate: '45deg' }],
  },
  dot: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
  },
  dot1: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.1,
    bottom: 40,
    left: 45,
  },
  dot2: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.08,
    bottom: 52,
    left: 55,
  },
  dot3: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.06,
    bottom: 30,
    left: 60,
  },
});
