import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAndroidBack } from '../utils/useAndroidBack';
import { haptics } from '../utils/haptics';
import { analytics, EVENTS } from '../services/analytics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  pos: string | null;
  onClose: () => void;
}

interface GrammarEntry {
  title: string;
  emoji: string;
  oneLiner: string;
  examples: { word: string; sentence: string }[];
  tips: string[];
  color: string;
}

// Static curriculum — enough to cover a Free Dictionary payload.
// Keys are the exact partOfSpeech strings the API returns (lowercase).
const GRAMMAR: Record<string, GrammarEntry> = {
  noun: {
    title: 'Noun',
    emoji: '📦',
    oneLiner: 'A word that names a person, place, thing, or idea.',
    examples: [
      { word: 'teacher',   sentence: 'The teacher smiled.' },
      { word: 'Paris',     sentence: 'Paris is quiet at dawn.' },
      { word: 'book',      sentence: 'She opened the book.' },
      { word: 'happiness', sentence: 'Happiness is a habit.' },
    ],
    tips: [
      'Common nouns are general (dog, city). Proper nouns are specific (Rex, Tokyo) and start with a capital.',
      'Nouns can be singular (car) or plural (cars).',
      'They often follow words like "the", "a", or "my".',
    ],
    color: '#4A7C59',
  },
  verb: {
    title: 'Verb',
    emoji: '🏃',
    oneLiner: 'A word that shows an action or state of being.',
    examples: [
      { word: 'run',    sentence: 'They run every morning.' },
      { word: 'read',   sentence: 'I read a novel last night.' },
      { word: 'be',     sentence: 'She is a doctor.' },
      { word: 'wonder', sentence: 'He wondered why she smiled.' },
    ],
    tips: [
      'Verbs change form for tense: read → read → reading.',
      'A sentence needs at least one verb to be complete.',
      'Some verbs (be, seem, feel) link a subject to a description.',
    ],
    color: '#C5A880',
  },
  adjective: {
    title: 'Adjective',
    emoji: '🎨',
    oneLiner: 'A word that describes a noun — colour, size, feeling, quality.',
    examples: [
      { word: 'quiet',       sentence: 'A quiet sanctuary.' },
      { word: 'clandestine', sentence: 'A clandestine meeting.' },
      { word: 'bright',      sentence: 'The bright sky opened up.' },
      { word: 'tired',       sentence: 'A tired traveller.' },
    ],
    tips: [
      'Adjectives usually sit BEFORE the noun: "a red car".',
      'They can also sit AFTER a linking verb: "The car is red".',
      'Compare with "-er" and "-est": tall, taller, tallest.',
    ],
    color: '#8B5FBF',
  },
  adverb: {
    title: 'Adverb',
    emoji: '⚡',
    oneLiner: 'A word that modifies a verb, adjective, or another adverb — often ends in "-ly".',
    examples: [
      { word: 'quickly',   sentence: 'She read quickly.' },
      { word: 'very',      sentence: 'The tea was very hot.' },
      { word: 'carefully', sentence: 'He walked carefully across.' },
      { word: 'often',     sentence: 'They often meet on Fridays.' },
    ],
    tips: [
      'Many adverbs answer "how?", "when?", or "where?".',
      'Not all adverbs end in -ly (fast, well, often).',
      'Placement matters: "only I saw her" vs "I saw only her".',
    ],
    color: '#DC7A5F',
  },
  pronoun: {
    title: 'Pronoun',
    emoji: '🪞',
    oneLiner: 'A word that stands in for a noun so you don\'t repeat it.',
    examples: [
      { word: 'she',    sentence: 'Anna is here. She is smiling.' },
      { word: 'it',     sentence: 'The book is new. It looks good.' },
      { word: 'they',   sentence: 'The kids ran. They laughed.' },
      { word: 'anyone', sentence: 'Anyone can join.' },
    ],
    tips: [
      'Personal pronouns: I, you, he, she, it, we, they.',
      'The word a pronoun replaces is called its antecedent — make sure it\'s clear.',
      'Use the right case: "she and I" (not "her and me") as a subject.',
    ],
    color: '#4A6FA5',
  },
  preposition: {
    title: 'Preposition',
    emoji: '🧭',
    oneLiner: 'A little word that connects a noun to the rest of the sentence — usually about position, time, or direction.',
    examples: [
      { word: 'in',      sentence: 'She lives in Delhi.' },
      { word: 'before',  sentence: 'We met before sunrise.' },
      { word: 'through', sentence: 'He walked through the door.' },
      { word: 'with',    sentence: 'Come with me.' },
    ],
    tips: [
      'Common ones: in, on, at, by, for, with, from, to, of.',
      'Time & place are the two biggest jobs (at 5pm, on Monday, in Paris).',
      'Try not to end a formal sentence with one — but in everyday English it\'s fine.',
    ],
    color: '#2E86A5',
  },
  conjunction: {
    title: 'Conjunction',
    emoji: '🔗',
    oneLiner: 'A word that joins other words, phrases, or whole sentences together.',
    examples: [
      { word: 'and',      sentence: 'Tea and biscuits.' },
      { word: 'but',      sentence: 'Small but strong.' },
      { word: 'because',  sentence: 'She left because it was late.' },
      { word: 'although', sentence: 'Although tired, he kept reading.' },
    ],
    tips: [
      'Coordinating: for, and, nor, but, or, yet, so ("FANBOYS").',
      'Subordinating (because, although, if, when) start a dependent clause.',
      'Use a comma before a conjunction that joins two full sentences.',
    ],
    color: '#7A9B8A',
  },
  interjection: {
    title: 'Interjection',
    emoji: '💬',
    oneLiner: 'A word or short sound that shows feeling — often stands alone.',
    examples: [
      { word: 'wow',   sentence: 'Wow, look at that!' },
      { word: 'ouch',  sentence: 'Ouch! That hurt.' },
      { word: 'oh',    sentence: 'Oh, I didn\'t know.' },
      { word: 'hey',   sentence: 'Hey, over here.' },
    ],
    tips: [
      'Usually followed by an exclamation mark or a comma.',
      'Common in speech and dialogue, less in formal writing.',
      'They don\'t connect grammatically to the rest of the sentence.',
    ],
    color: '#D9646F',
  },
  determiner: {
    title: 'Determiner',
    emoji: '🎯',
    oneLiner: 'A word that goes before a noun to specify which one, how many, or whose.',
    examples: [
      { word: 'the',   sentence: 'The dog barked.' },
      { word: 'this',  sentence: 'This book is mine.' },
      { word: 'some',  sentence: 'Some tea, please.' },
      { word: 'my',    sentence: 'My phone rang.' },
    ],
    tips: [
      'Articles (a, an, the) are the most common determiners.',
      'Also: this/that/these/those, my/your/his, some/any/many.',
      'Only one determiner per noun phrase.',
    ],
    color: '#B08D57',
  },
};

const FALLBACK: GrammarEntry = {
  title: 'Part of speech',
  emoji: '📖',
  oneLiner: 'A category that describes how a word is used in a sentence.',
  examples: [],
  tips: [
    'The 8 main types: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection.',
    'The same word can be different parts of speech in different sentences.',
  ],
  color: COLORS.mutedText,
};

export const GrammarInfoSheet: React.FC<Props> = ({ pos, onClose }) => {
  const visible = pos !== null;
  const entry = pos ? (GRAMMAR[pos.toLowerCase()] ?? FALLBACK) : FALLBACK;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && pos) {
      analytics.logEvent(EVENTS.grammar_sheet_open, { part_of_speech: pos });
    }
  }, [visible, pos]);

  useEffect(() => {
    if (visible) {
      haptics.tapLight();
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true, friction: 12, tension: 60,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useAndroidBack(() => { onClose(); }, visible);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.heroChip, { backgroundColor: entry.color + '15', borderColor: entry.color + '40' }]}>
              <Text style={styles.heroEmoji}>{entry.emoji}</Text>
              <Text style={[styles.heroTitle, { color: entry.color }]}>{entry.title}</Text>
            </View>

            <Text style={styles.oneLiner}>{entry.oneLiner}</Text>

            {entry.examples.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Examples</Text>
                {entry.examples.map((ex, i) => (
                  <View key={i} style={styles.exampleRow}>
                    <View style={[styles.exampleDot, { backgroundColor: entry.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exampleWord}>{ex.word}</Text>
                      <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {entry.tips.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Good to know</Text>
                {entry.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Ionicons name="bulb-outline" size={14} color={COLORS.gold} style={{ marginTop: 2 }} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            )}

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 32 },

  heroChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  heroEmoji: { fontSize: 18 },
  heroTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  oneLiner: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    lineHeight: 30,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mutedText,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  exampleWord: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.medium },
  exampleSentence: { fontSize: 13, color: COLORS.mutedText, marginTop: 2, fontStyle: 'italic' },

  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.text },

  closeBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.text,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15, letterSpacing: 0.3 },
});
