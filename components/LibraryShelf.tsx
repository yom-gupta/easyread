import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { Book } from '../context/ReadingContext';
import { BookBadge } from '../utils/bookHelpers';
import { BookSpine } from './BookSpine';

export const BOOKS_PER_SHELF_ROW = 5;

export function chunkBooks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface LibraryShelfProps {
  label: string;
  icon: string;
  books: Book[];
  visibleBookIds?: Set<string>;
  currentBookId?: string;
  getBadges: (book: Book) => BookBadge[];
  getLogData: (bookId: string) => Record<string, number>;
  onBookPress: (book: Book) => void;
  onSetActive?: (bookId: string) => void;
  shelfIndex?: number;
  filterAnimating?: boolean;
}

export const LibraryShelf: React.FC<LibraryShelfProps> = ({
  label,
  icon,
  books,
  visibleBookIds,
  currentBookId,
  getBadges,
  getLogData,
  onBookPress,
  onSetActive,
  shelfIndex = 0,
  filterAnimating = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const rows = chunkBooks(books, BOOKS_PER_SHELF_ROW);

  useEffect(() => {
    if (!filterAnimating) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: shelfIndex * 80,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          delay: shelfIndex * 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [books.map(b => b.bookId).join(','), label, filterAnimating]);

  if (books.length === 0) return null;

  const renderShelfRow = (rowBooks: Book[], rowIndex: number) => (
    <View key={`row-${rowIndex}`} style={[styles.shelfUnit, rowIndex > 0 && styles.shelfUnitStacked]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.booksRow}
      >
        {rowBooks.map((book, idx) => {
          const globalIdx = rowIndex * BOOKS_PER_SHELF_ROW + idx;
          const isVisible = visibleBookIds ? visibleBookIds.has(book.bookId) : true;

          return (
            <BookSpine
              key={book.bookId}
              book={book}
              index={globalIdx}
              isCurrent={book.bookId === currentBookId}
              badges={getBadges(book)}
              logData={getLogData(book.bookId)}
              onPress={() => onBookPress(book)}
              onSetActive={onSetActive ? () => onSetActive(book.bookId) : undefined}
              visible={isVisible}
              enterDelay={isVisible && filterAnimating ? globalIdx * 40 : 0}
            />
          );
        })}
      </ScrollView>

      <View style={styles.shelfPlank}>
        <View style={styles.shelfTopEdge} />
        <View style={styles.shelfFront} />
        <View style={styles.shelfShadow} />
      </View>
      <View style={styles.bracketLeft} />
      <View style={styles.bracketRight} />
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.shelfSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.shelfLabelRow}>
        <Ionicons name={icon as any} size={14} color={COLORS.accent} />
        <Text style={styles.shelfLabel}>{label}</Text>
        {rows.length > 1 && (
          <Text style={styles.shelfSubLabel}>{rows.length} shelves</Text>
        )}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{books.length}</Text>
        </View>
      </View>

      {rows.map((row, idx) => renderShelfRow(row, idx))}
    </Animated.View>
  );
};

const WOOD = {
  dark: '#6B4F10',
  mid: '#8B6914',
  edge: '#C4A265',
};

const styles = StyleSheet.create({
  shelfSection: {

    marginBottom: SPACING.lg,
  },
  shelfLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  shelfLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    letterSpacing: 0.5,
  },
  shelfSubLabel: {
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(74,124,89,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  shelfUnit: {
    position: 'relative',
    paddingBottom: 4,
  },
  shelfUnitStacked: {
    marginTop: SPACING.md,
  },
  booksRow: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 0,
    alignItems: 'flex-end',
    minHeight: 165,
  },
  shelfPlank: {
    marginHorizontal: SPACING.xs,
    height: 14,
    position: 'relative',
  },
  shelfTopEdge: {
    height: 4,
    backgroundColor: WOOD.edge,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  shelfFront: {
    height: 10,
    backgroundColor: WOOD.mid,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shelfShadow: {
    position: 'absolute',
    bottom: -6,
    left: 8,
    right: 8,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 50,
  },
  bracketLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 6,
    height: 20,
    backgroundColor: WOOD.dark,
    borderRadius: 2,
  },
  bracketRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 6,
    height: 20,
    backgroundColor: WOOD.dark,
    borderRadius: 2,
  },
});
