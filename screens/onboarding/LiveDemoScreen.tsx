import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { haptics } from './haptics';

interface Props {
  onFinish: () => void;
  onSkip: () => void;
}

// One-word interactive demo. Tap the highlighted word → definition card
// springs in → save state confirms the vocab-notebook flow.
const SAMPLE = ['A', 'good', 'book', 'is', 'a', 'quiet'];
const HIGHLIGHT = 'sanctuary';
const TAIL = ['.'];

const DEFINITION = {
  word: 'sanctuary',
  pos: 'noun',
  gloss: 'a place of refuge or safety.',
};

export const LiveDemoScreen: React.FC<Props> = ({ onFinish, onSkip }) => {
  const [tapped, setTapped] = useState(false);

  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const wordScale = useRef(new Animated.Value(1)).current;

  const onWordPress = () => {
    if (tapped) return;
    haptics.success();
    setTapped(true);

    Animated.sequence([
      Animated.spring(wordScale, { toValue: 1.15, useNativeDriver: true, friction: 4 }),
      Animated.spring(wordScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();

    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Try the word magic</Text>
        <Text style={styles.subtitle}>Tap the underlined word — that's the whole feature.</Text>
      </View>

      <View style={styles.readingCard}>
        <Text style={styles.paragraph}>
          {SAMPLE.join(' ') + ' '}
          <Text
            accessibilityRole="button"
            accessibilityLabel={`Tap the word ${HIGHLIGHT}`}
            onPress={onWordPress}
            style={styles.highlight}
          >
            {HIGHLIGHT}
          </Text>
          {TAIL.join('')}
        </Text>
      </View>

      <Animated.View
        pointerEvents={tapped ? 'auto' : 'none'}
        style={[
          styles.defCard,
          { opacity: cardOpacity, transform: [{ scale: cardScale }] },
        ]}
      >
        <View style={styles.defTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.defWord}>{DEFINITION.word}</Text>
            <Text style={styles.defPos}>{DEFINITION.pos}</Text>
          </View>
          <View style={styles.savedPill}>
            <Ionicons name="bookmark" size={12} color={COLORS.white} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        </View>
        <Text style={styles.defGloss}>{DEFINITION.gloss}</Text>
        <Text style={styles.defFooter}>Kept in your vocab notebook forever.</Text>
      </Animated.View>

      <View style={{ gap: SPACING.md }}>
        <PrimaryButton
          label={tapped ? "Let's start reading" : 'Continue'}
          icon="rocket-outline"
          onPress={onFinish}
        />
        <Pressable onPress={onSkip} accessibilityRole="button">
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: { marginBottom: SPACING.lg },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.mutedText,
    lineHeight: 22,
  },
  readingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paragraph: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    lineHeight: 34,
    color: COLORS.text,
  },
  highlight: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  defCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    marginTop: SPACING.md,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  defTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  defWord: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  defPos: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  savedText: { color: COLORS.white, fontSize: 11, fontFamily: FONTS.medium, fontWeight: '600' },
  defGloss: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginTop: 4,
  },
  defFooter: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: SPACING.sm,
  },
  skipText: {
    textAlign: 'center',
    color: COLORS.mutedText,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
