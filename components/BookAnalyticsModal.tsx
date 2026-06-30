import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { Book, useReading } from '../context/ReadingContext';
import { PerBookHeatmap } from './PerBookHeatmap';
import { ReadingProgressBar } from './ReadingProgressBar';
import { getBookBadges, getBookDailyPages, getBookPageMarkers } from '../utils/bookHelpers';

interface BookAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  book: Book | null;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const BookAnalyticsModal: React.FC<BookAnalyticsModalProps> = ({ visible, onClose, book }) => {
  const { vocabNotebook, logs, readingMarkers } = useReading();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!book) return null;

  // Compute analytics
  const bookLogs = logs.filter(l => l.bookId === book.bookId);
  const daysRead = new Set(bookLogs.map(l => l.dateString)).size;
  const totalPagesRead = bookLogs.reduce((sum, log) => sum + log.pagesReadDelta, 0);
  const averagePace = daysRead > 0 ? Math.round(totalPagesRead / daysRead) : 0;
  
  const bookVocab = vocabNotebook.filter(v => v.bookId === book.bookId);
  const pct = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
  const dailyPages = getBookDailyPages(book.bookId, logs);
  const markers = getBookPageMarkers(book.bookId, readingMarkers, vocabNotebook);
  const badges = getBookBadges(book, logs, vocabNotebook);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handle} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Book Analytics</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Book Info */}
            <View style={styles.bookHeader}>
              {book.coverUrl && (
                <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
              )}
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>by {book.author}</Text>
              {book.status === 'completed' && (
                <View style={styles.completedPill}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={styles.completedPillText}>Completed</Text>
                </View>
              )}
            </View>

            {/* Progress with bookmarks */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Reading Progress</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <ReadingProgressBar
                pagesRead={book.pagesRead}
                totalPages={book.totalPages}
                height={10}
              />
              <Text style={styles.progressMeta}>
                {book.pagesRead} / {book.totalPages} pages
                {markers.length > 0 ? ` · ${markers.length} bookmarks` : ''}
              </Text>
            </View>

            {/* Badges */}
            {badges.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.badgeGrid}>
                  {badges.map(b => (
                    <View key={b.id} style={styles.badgeCard}>
                      <View style={[styles.badgeIcon, { backgroundColor: b.color + '20' }]}>
                        <Ionicons name={b.icon as any} size={18} color={b.color} />
                      </View>
                      <Text style={styles.badgeLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Heatmap */}
            <View style={styles.heatmapSection}>
              <PerBookHeatmap logData={dailyPages} />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{daysRead}</Text>
                <Text style={styles.statLabel}>Days Read</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="speedometer-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{averagePace}</Text>
                <Text style={styles.statLabel}>Pages / Day</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="bookmark-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{bookVocab.length}</Text>
                <Text style={styles.statLabel}>Words Learned</Text>
              </View>
            </View>

            {/* Vocabulary Section */}
            <Text style={styles.sectionTitle}>Vocabulary Learned</Text>
            {bookVocab.length === 0 ? (
              <Text style={styles.emptyText}>You haven't saved any words from this book yet.</Text>
            ) : (
              bookVocab.map((word, index) => (
                <View key={`${word.word}-${index}`} style={styles.vocabCard}>
                  <View style={styles.vocabHeader}>
                    <Text style={styles.vocabWord}>{word.word}</Text>
                    {word.pageLearned && (
                      <Text style={styles.vocabPage}>Pg {word.pageLearned}</Text>
                    )}
                  </View>
                  <Text style={styles.vocabDef}>{word.definition}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  bookHeader: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  coverImage: {
    width: 80,
    height: 110,
    borderRadius: 6,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(74,124,89,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressPct: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    fontFamily: FONTS.serif,
  },
  progressMeta: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 8,
    fontWeight: '600',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  heatmapSection: {
    marginBottom: SPACING.lg,
  },
  bookTitle: {
    fontSize: 22,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 15,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
    fontFamily: FONTS.serif,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.mutedText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  vocabCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  vocabPage: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vocabDef: {
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
});
