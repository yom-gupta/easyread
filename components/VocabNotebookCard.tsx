import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';

const notebookImg = require('../assets/Vocabulary notebook design.png');

interface VocabNotebookCardProps {
  onPress: () => void;
}

export const VocabNotebookCard: React.FC<VocabNotebookCardProps> = ({ onPress }) => {
  const { vocabNotebook } = useReading();
  const wordCount = vocabNotebook.length;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardLabel}>Vocabulary Notebook</Text>
        <View style={styles.wordBadge}>
          <Ionicons name="bookmark" size={12} color={COLORS.accent} />
          <Text style={styles.wordBadgeText}>{wordCount} words</Text>
        </View>
      </View>

      <View style={styles.bookRow}>
        <View style={styles.coverWrap}>
          <Image source={notebookImg} style={styles.cover} resizeMode="cover" />
          <View style={styles.coverShadow} />
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>My Vocabulary</Text>
          <Text style={styles.bookAuthor}>Personal word collection</Text>
          <View style={styles.progressStrip}>
            <View style={[styles.progressFill, { width: `${Math.min(100, wordCount * 5)}%` }]} />
          </View>
          <Text style={styles.progressMeta}>
            {wordCount === 0 ? 'Tap to start saving words' : `${wordCount} saved Â· tap to open`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  wordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,124,89,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  wordBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coverWrap: {
    position: 'relative',
  },
  cover: {
    width: 50,
    height: 70,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coverShadow: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 50,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
    marginBottom: 8,
  },
  progressStrip: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressMeta: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
});


