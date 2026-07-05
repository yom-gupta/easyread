import React from 'react';
import {
  Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, Image, PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { Book, useReading } from '../context/ReadingContext';
import { PerBookHeatmap } from './PerBookHeatmap';
import { ReadingProgressBar } from './ReadingProgressBar';
import { getBookBadges, getBookDailyPages, getBookPageMarkers } from '../utils/bookHelpers';
import { getPerBookTemplate } from '../utils/achievementHelpers';

interface BookAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  book: Book | null;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const BookAnalyticsModal: React.FC<BookAnalyticsModalProps> = ({ visible, onClose, book }) => {
  const { vocabNotebook, logs, readingMarkers, currentBook, setCurrentBook, getBookNotes, removeNote } = useReading();
  const panY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;
  const contentTranslateY = React.useRef(new Animated.Value(20)).current;
  const isDismissing = React.useRef(false);
  const [activeSection, setActiveSection] = React.useState<'vocab' | 'notes'>('vocab');

  React.useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      setActiveSection('vocab');
      panY.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      contentFadeAnim.setValue(0);
      contentTranslateY.setValue(20);
      Animated.parallel([
        Animated.spring(panY, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          })
        ]).start();
      });
    } else if (!isDismissing.current) {
      Animated.parallel([
        Animated.timing(panY, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        panY.setValue(Math.max(0, gs.dy));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120) {
          isDismissing.current = true;
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: false,
          }).start(() => onClose());
        } else {
          Animated.spring(panY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (!book) return null;

  const isCurrent = currentBook?.bookId === book.bookId;

  // Compute analytics
  const bookLogs = logs.filter(l => l.bookId === book.bookId);
  const daysRead = new Set(bookLogs.map(l => l.dateString)).size;
  const totalPagesRead = bookLogs.reduce((sum, log) => sum + log.pagesReadDelta, 0);
  const averagePace = daysRead > 0 ? Math.round(totalPagesRead / daysRead) : 0;

  const bookVocab = vocabNotebook.filter(v => v.bookId === book.bookId);
  const bookNotes = getBookNotes(book.bookId);
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
          { transform: [{ translateY: panY }] },
        ]}
      >
        <View style={styles.handle} {...panResponder.panHandlers} />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Book Analytics</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'vocab' && styles.sectionTabActive]}
              onPress={() => setActiveSection('vocab')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bookmark-outline"
                size={14}
                color={activeSection === 'vocab' ? COLORS.white : COLORS.mutedText}
              />
              <Text style={[styles.sectionTabText, activeSection === 'vocab' && styles.sectionTabTextActive]}>
                Vocabulary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'notes' && styles.sectionTabActive]}
              onPress={() => setActiveSection('notes')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={activeSection === 'notes' ? COLORS.white : COLORS.mutedText}
              />
              <Text style={[styles.sectionTabText, activeSection === 'notes' && styles.sectionTabTextActive]}>
                Notes
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: contentFadeAnim, transform: [{ translateY: contentTranslateY }] }}>
              {/* Unified Two Column Card */}
              <View style={styles.unifiedCard}>
                <View style={styles.twoColumnContainer}>
                  {/* Left Column: Book Details */}
                  <View style={styles.leftColumn}>
                    {book.coverUrl && (
                      <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
                    )}
                    <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>

                    {book.status === 'completed' ? (
                      <View style={styles.completedPill}>
                        <Ionicons name="checkmark-circle" size={12} color={COLORS.accent} />
                        <Text style={styles.completedPillText}>Completed</Text>
                      </View>
                    ) : (
                      <View style={[styles.completedPill, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                        <Ionicons name="book-outline" size={12} color="#2563EB" />
                        <Text style={[styles.completedPillText, { color: '#2563EB' }]}>Reading</Text>
                      </View>
                    )}

                    {!isCurrent && book.status === 'reading' && (
                      <TouchableOpacity
                        style={styles.switchActiveBtn}
                        onPress={() => {
                          setCurrentBook(book.bookId);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="swap-horizontal" size={12} color={COLORS.white} />
                        <Text style={styles.switchActiveBtnText}>Set Active</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right Column: Progress & Achievements */}
                  <View style={styles.rightColumn}>
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Progress</Text>
                        <Text style={styles.progressPct}>{pct}%</Text>
                      </View>
                      <ReadingProgressBar
                        pagesRead={book.pagesRead}
                        totalPages={book.totalPages}
                        height={8}
                      />
                      <Text style={styles.progressMeta}>
                        {book.pagesRead}/{book.totalPages} p
                        {markers.length > 0 ? ` · ${markers.length} bmark` : ''}
                      </Text>
                    </View>

                    {badges.length > 0 && (
                      <View style={styles.badgeSection}>
                        <Text style={styles.badgeSectionTitle}>Badges</Text>
                        <View style={styles.badgeGrid}>
                          {badges.map(b => (
                            <View key={b.id} style={[styles.badgeCard, { borderColor: b.color + '40' }]}>
                              <Ionicons name={b.icon as any} size={10} color={b.color} style={{ marginRight: 2 }} />
                              <Text style={[styles.badgeLabel, { color: b.color }]} numberOfLines={1}>{b.label}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

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

            {/* In-Book Achievements Section */}
            {book.bookAchievements && book.bookAchievements.length > 0 && (
              <View style={styles.inlineAchSection}>
                <Text style={styles.sectionTitle}>In-Book Achievements</Text>
                <View style={styles.inlineAchRow}>
                  {book.bookAchievements.map((suffix) => {
                    const template = getPerBookTemplate(suffix);
                    if (!template) return null;
                    return (
                      <View key={suffix} style={styles.inlineAchBadge}>
                        <Text style={styles.inlineAchEmoji}>{template.emoji}</Text>
                        <Text style={styles.inlineAchName}>{template.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {activeSection === 'vocab' ? (
              <>
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
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Notes</Text>
                {bookNotes.length === 0 ? (
                  <Text style={styles.emptyText}>Take your first note for this book.</Text>
                ) : (
                  bookNotes.map((item) => (
                    <View key={item.id} style={styles.noteCard}>
                      <View style={styles.noteHeader}>
                        <View style={styles.noteMetaRow}>
                          <View style={styles.noteKindPill}>
                            <Text style={styles.noteKindPillText}>
                              {item.sourceKind === 'scan' ? 'Scan' : 'Typed'}
                            </Text>
                          </View>
                          {item.page ? (
                            <Text style={styles.notePage}>Page {item.page}</Text>
                          ) : null}
                        </View>
                        <View style={styles.noteActions}>
                          <TouchableOpacity
                            onPress={() => removeNote(item.id)}
                            style={styles.noteIconBtn}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.noteText}>{item.text}</Text>
                      {item.sectionText ? (
                        <View style={styles.noteSectionBox}>
                          <Text style={styles.noteSectionLabel}>Section text</Text>
                          <Text style={styles.noteSectionText}>{item.sectionText}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </>
            )}
            <View style={{ marginBottom: 50 }} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mutedText,
  },
  sectionTabTextActive: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  unifiedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftColumn: {
    width: '45%',
    alignItems: 'flex-start',
  },
  rightColumn: {
    width: '50%',
    justifyContent: 'flex-start',
  },
  coverImage: {
    width: 80,
    height: 110,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  switchActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
  },
  switchActiveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 11,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(74,124,89,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressSection: {
    backgroundColor: 'rgba(74, 124, 89, 0.03)',
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.1)',
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
  badgeSection: {
    marginTop: SPACING.xs,
  },
  badgeSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: SPACING.xs,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  heatmapSection: {
    marginBottom: SPACING.lg,
  },
  bookTitle: {
    fontSize: 18,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
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
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  noteKindPill: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  noteKindPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  notePage: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mutedText,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteIconBtn: {
    padding: 4,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: SPACING.sm,
  },
  noteSectionBox: {
    backgroundColor: 'rgba(74, 124, 89, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.12)',
    padding: SPACING.sm,
  },
  noteSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  noteSectionText: {
    fontSize: 13,
    color: COLORS.mutedText,
    lineHeight: 19,
  },
  inlineAchSection: {
    marginBottom: SPACING.lg,
  },
  inlineAchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inlineAchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  inlineAchEmoji: {
    fontSize: 14,
  },
  inlineAchName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
});
