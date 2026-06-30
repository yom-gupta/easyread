import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading, Book } from '../context/ReadingContext';
import { AddBookModal } from '../components/AddBookModal';
import { BookAnalyticsModal } from '../components/BookAnalyticsModal';
import { VocabLookupModal } from '../components/VocabLookupModal';
import { VocabNotebookCard } from '../components/VocabNotebookCard';
import { LibraryShelf } from '../components/LibraryShelf';
import {
  LibraryFilter,
  FILTER_OPTIONS,
  filterBooks,
  getBookBadges,
  getBookDailyPages,
} from '../utils/bookHelpers';

export const LibraryScreen: React.FC = () => {
  const { books, currentBook, setCurrentBook, logs, vocabNotebook } = useReading();
  const [addBookModalVisible, setAddBookModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [vocabModalVisible, setVocabModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const [visibleBookIds, setVisibleBookIds] = useState<Set<string>>(
    () => new Set(books.map(b => b.bookId)),
  );
  const [filterAnimating, setFilterAnimating] = useState(false);

  const handleFilterPress = useCallback((filter: LibraryFilter) => {
    if (filter === activeFilter || filterAnimating) return;

    const newFiltered = filterBooks(books, filter, logs, vocabNotebook);
    const newIds = new Set(newFiltered.map(b => b.bookId));

    setFilterAnimating(true);
    setVisibleBookIds(newIds);

    setTimeout(() => {
      setActiveFilter(filter);
      setFilterAnimating(false);
    }, 420);
  }, [activeFilter, books, logs, vocabNotebook, filterAnimating]);

  useEffect(() => {
    if (!filterAnimating) {
      const ids = filterBooks(books, activeFilter, logs, vocabNotebook).map(b => b.bookId);
      setVisibleBookIds(new Set(ids));
    }
  }, [books.length, activeFilter, filterAnimating]);

  const filtered = filterBooks(books, activeFilter, logs, vocabNotebook);
  const readingBooks = filtered.filter(b => b.status === 'reading');
  const completedBooks = filtered.filter(b => b.status === 'completed');

  const getBadges = (book: Book) => getBookBadges(book, logs, vocabNotebook);
  const getLogData = (bookId: string) => getBookDailyPages(bookId, logs);
  const totalBadges = books.reduce((sum, b) => sum + getBadges(b).length, 0);

  const shelfProps = {
    currentBookId: currentBook?.bookId,
    getBadges,
    getLogData,
    onBookPress: (book: Book) => { setSelectedBook(book); setAnalyticsModalVisible(true); },
    filterAnimating,
    visibleBookIds: filterAnimating ? visibleBookIds : undefined,
  };

  const renderShelves = () => {
    if (activeFilter === 'all') {
      return (
        <>
          {readingBooks.length > 0 && (
            <LibraryShelf
              label="Currently Reading"
              icon="book"
              books={readingBooks}
              onSetActive={setCurrentBook}
              shelfIndex={0}
              {...shelfProps}
            />
          )}
          {completedBooks.length > 0 && (
            <LibraryShelf
              label="Completed Collection"
              icon="checkmark-circle"
              books={completedBooks}
              shelfIndex={1}
              {...shelfProps}
            />
          )}
        </>
      );
    }

    if (activeFilter === 'achievements') {
      const hallOfFame = filtered.filter(b => getBadges(b).length >= 2);
      return (
        <>
          {hallOfFame.length > 0 && (
            <LibraryShelf
              label="Hall of Fame"
              icon="trophy"
              books={hallOfFame}
              onSetActive={setCurrentBook}
              shelfIndex={0}
              {...shelfProps}
            />
          )}
          <LibraryShelf
            label="Badge Collection"
            icon="ribbon"
            books={filtered}
            onSetActive={setCurrentBook}
            shelfIndex={1}
            {...shelfProps}
          />
        </>
      );
    }

    return (
      <LibraryShelf
        label={FILTER_OPTIONS.find(f => f.id === activeFilter)?.label || 'Books'}
        icon={FILTER_OPTIONS.find(f => f.id === activeFilter)?.icon || 'library'}
        books={filtered}
        onSetActive={activeFilter === 'reading' ? setCurrentBook : undefined}
        shelfIndex={0}
        {...shelfProps}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="library" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Library</Text>
            <Text style={styles.headerSub}>{books.length} books · {totalBadges} badges</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddBookModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map(opt => {
            const isActive = activeFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleFilterPress(opt.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={isActive ? COLORS.white : COLORS.mutedText}
                />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.vocabSection}>
          <VocabNotebookCard onPress={() => setVocabModalVisible(true)} />
        </View>

        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyShelf}>
              <View style={styles.emptyShelfPlank} />
            </View>
            <Ionicons name="library-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Your shelves are empty</Text>
            <Text style={styles.emptyDesc}>Add your first book and start building your personal library.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setAddBookModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.emptyAddBtnText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 && !filterAnimating ? (
          <View style={styles.emptyFilter}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyFilterTitle}>No books on this shelf</Text>
            <Text style={styles.emptyFilterDesc}>Try a different filter or add a new book.</Text>
          </View>
        ) : (
          renderShelves()
        )}
      </ScrollView>

      <AddBookModal visible={addBookModalVisible} onClose={() => setAddBookModalVisible(false)} />
      <BookAnalyticsModal
        visible={analyticsModalVisible}
        onClose={() => setAnalyticsModalVisible(false)}
        book={selectedBook}
      />
      <VocabLookupModal visible={vocabModalVisible} onClose={() => setVocabModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F0E8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: '#F5F0E8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif },
  headerSub: { fontSize: 11, color: COLORS.mutedText, fontWeight: '600', marginTop: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  filterContainer: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText: { fontSize: 12, fontWeight: '700', color: COLORS.mutedText },
  filterChipTextActive: { color: COLORS.white },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  vocabSection: { marginBottom: SPACING.md },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyShelf: { width: '80%', marginBottom: SPACING.lg },
  emptyShelfPlank: {
    height: 12,
    backgroundColor: '#8B6914',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginTop: SPACING.md,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: SPACING.lg,
  },
  emptyAddBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  emptyFilter: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyFilterTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  emptyFilterDesc: { fontSize: 13, color: COLORS.mutedText, marginTop: 4 },
});
