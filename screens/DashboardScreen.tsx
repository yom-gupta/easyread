import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';
import { UpdateProgressModal } from '../components/UpdateProgressModal';
import { VocabLookupModal } from '../components/VocabLookupModal';
import { CelebrationModal } from '../components/CelebrationModal';
import { StreakCelebrationModal } from '../components/StreakCelebrationModal';
import { AddBookModal } from '../components/AddBookModal';
import { InlineDictionarySearch } from '../components/InlineDictionarySearch';
import { BookAnalyticsModal } from '../components/BookAnalyticsModal';
import { QuickSwitchBookModal } from '../components/QuickSwitchBookModal';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { ReadingCompanion } from '../components/ReadingCompanion';
import { LevelUpModal } from '../components/LevelUpModal';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { StreakDetailModal } from '../components/StreakDetailModal';
import { getBookPageMarkers } from '../utils/bookHelpers';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StreakFlame } from '../components/StreakFlame';
import { haptics } from '../utils/haptics';
import { celebrateBookLogged, scheduleStreakGuard } from '../services/notifications';
import * as Speech from 'expo-speech';

export const DashboardScreen: React.FC = () => {
  const {
    user,
    currentBook,
    showFirstBookCelebration,
    updateProgress,
    dismissCelebration,
    getEstimatedCompletionDate,
    readingMarkers,
    vocabNotebook,
    streakTrigger,
    dismissStreakTrigger,
    pendingAchievements,
    dismissPendingAchievement,
    levelUpInfo,
    dismissLevelUp,
    logs,
  } = useReading();

  // Streak guard: re-schedule an "at-risk" warning whenever the user's log
  // state changes. Guard fires at 8pm today only if streak > 0 and they
  // haven't logged today; auto-cancels when they log.
  const loggedToday = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.some(l => l.dateString === today);
  }, [logs]);
  useEffect(() => {
    scheduleStreakGuard({
      currentStreak: user.currentStreak,
      hasLoggedToday: loggedToday,
    });
  }, [user.currentStreak, loggedToday]);

  // TTS warmup — kicks the OS speech engine to initialise so the first real
  // speakWord() call in the dictionary card has zero cold-start latency.
  useEffect(() => {
    Speech.getAvailableVoicesAsync().catch(() => { /* silent */ });
  }, []);

  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [vocabModalVisible, setVocabModalVisible] = useState(false);
  const [addBookModalVisible, setAddBookModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchSeedRef = useRef<((word: string) => void) | null>(null);
  const [switchBookModalVisible, setSwitchBookModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);

  const prevPagesRead = useRef(currentBook?.pagesRead || 0);
  const streakPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1.18,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [streakPulse]);

  // Key the "previous pages" ref by book id so switching books doesn't
  // spuriously fire confetti the first time we view a new book at a higher page.
  const prevBookIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentBook) return;
    if (prevBookIdRef.current !== currentBook.bookId) {
      prevBookIdRef.current = currentBook.bookId;
      prevPagesRead.current = currentBook.pagesRead;
      return;
    }
    if (currentBook.pagesRead > prevPagesRead.current) {
      haptics.tapLight();
      setShowConfetti(true);
      prevPagesRead.current = currentBook.pagesRead;
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [currentBook?.bookId, currentBook?.pagesRead]);

  // Haptics on streak change. Milestones (7 / 30 / 100 / any multiple of 7)
  // get the full success buzz; ordinary day-tick gets a medium tap.
  useEffect(() => {
    if (!streakTrigger) return;
    if (streakTrigger.isBreak) {
      haptics.warning();
      return;
    }
    const n = streakTrigger.count;
    const isMilestone = n === 7 || n === 30 || n === 100 || (n > 0 && n % 7 === 0);
    if (isMilestone) haptics.success();
    else haptics.tapMedium();
  }, [streakTrigger]);

  const progressPercent = currentBook
    ? Math.round((currentBook.pagesRead / currentBook.totalPages) * 100)
    : 0;

  const pageMarkers = currentBook
    ? getBookPageMarkers(currentBook.bookId, readingMarkers, vocabNotebook)
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {showConfetti && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
          <LottieView
            source={require('../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>Good reading,</Text>
            <Text style={styles.greetingName}>{user.displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.streakBadge}
            onPress={() => { haptics.tapLight(); setStreakModalVisible(true); }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Current streak ${user.currentStreak} days${loggedToday ? '' : ', not logged today'}`}
          >
            <Animated.View style={[styles.streakFlameWrap, { transform: [{ scale: streakPulse }] }]}>
              <StreakFlame size={26} hasLoggedToday={loggedToday} />
            </Animated.View>
            <AnimatedNumber value={user.currentStreak} style={styles.streakText} />
          </TouchableOpacity>
        </View>

        {/* ── Currently Reading Card ── */}
        <View>
          {currentBook ? (
            isSearchActive ? (
              <TouchableOpacity
                style={[styles.bookCard, styles.bookCardCompact]}
                activeOpacity={0.7}
                onPress={() => setAnalyticsModalVisible(true)}
              >
                <View style={styles.bookRowCompact}>
                  {currentBook.coverUrl ? (
                    <Image source={{ uri: currentBook.coverUrl }} style={styles.bookCoverCompact} />
                  ) : (
                    <View style={styles.bookCoverCompact}>
                      <Ionicons name="book" size={16} color={COLORS.accent} />
                    </View>
                  )}
                  <Text style={styles.bookTitleCompact} numberOfLines={1}>{currentBook.title}</Text>
                  <Text style={styles.progressPctCompact}>{progressPercent}%</Text>
                </View>
              </TouchableOpacity>
            ) : (
            <View style={styles.bookCard}>
              {/* Book header */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardLabel}>Currently Reading</Text>
                <TouchableOpacity
                  style={styles.switchBookBtn}
                  onPress={() => setSwitchBookModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="swap-horizontal" size={14} color={COLORS.accent} />
                  <Text style={styles.switchBookBtnText}>Switch</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.bookTouchable}
                activeOpacity={0.7}
                onPress={() => setAnalyticsModalVisible(true)}
              >
                <View style={styles.bookRow}>
                  {/* Book Cover Image */}
                  {currentBook.coverUrl ? (
                    <Image source={{ uri: currentBook.coverUrl }} style={styles.bookCover} />
                  ) : (
                    <View style={styles.bookCover}>
                      <Ionicons name="book" size={24} color={COLORS.accent} />
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{currentBook.title}</Text>
                    <Text style={styles.bookAuthor}>{currentBook.author}</Text>
                  </View>
                  <Text style={styles.progressPct}>{progressPercent}%</Text>
                </View>
              </TouchableOpacity>

              {/* Progress bar with bookmark markers */}
              <ReadingProgressBar
                pagesRead={currentBook.pagesRead}
                totalPages={currentBook.totalPages}
                height={8}
              />

              <View style={styles.progressMeta}>
                <Text style={styles.progressMetaText}>
                  {currentBook.pagesRead} / {currentBook.totalPages} pages
                </Text>
                <Text style={styles.completionText}>
                  Est. done: {getEstimatedCompletionDate(currentBook)}
                </Text>
              </View>

              {/* Log Pages Button */}
              <TouchableOpacity
                style={styles.logBtn}
                onPress={() => setProgressModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.logBtnText}>Log Today's Pages</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={44} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No book active</Text>
            <Text style={styles.emptyDesc}>Add a book to start tracking your reading.</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddBookModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addBtnText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>

        {/* ── Word Lookup Search Bar ── */}
        <InlineDictionarySearch
          onOpenNotebook={() => setVocabModalVisible(true)}
          onFocusChange={setIsSearchActive}
          seedRef={searchSeedRef}
        />

        {/* Warm Reading Companion filling the empty space */}
        {!isSearchActive && <ReadingCompanion />}

        {/* Simulation (dev tool) */}

      </ScrollView>

      {/* Modals */}
      <UpdateProgressModal
        visible={progressModalVisible}
        onClose={() => setProgressModalVisible(false)}
        book={currentBook}
        onUpdate={(...args: any[]) => {
          const result = (updateProgress as any)(...args);
          const pages = typeof args[1] === 'number' ? args[1] : 0;
          if (currentBook && pages > 0) {
            // Fire a delayed "you did it" system notification — Zomato-style celebration.
            celebrateBookLogged(currentBook.title, pages);
          }
          return result;
        }}
      />
      <VocabLookupModal
        visible={vocabModalVisible}
        onClose={() => setVocabModalVisible(false)}
      />
      <AddBookModal
        visible={addBookModalVisible}
        onClose={() => setAddBookModalVisible(false)}
      />
      <CelebrationModal
        visible={showFirstBookCelebration}
        onDismiss={dismissCelebration}
        userName={user.displayName}
        bookTitle={currentBook?.title || 'Your Book'}
        bookAuthor={currentBook?.author || 'Unknown Author'}
      />
      <StreakCelebrationModal
        trigger={streakTrigger}
        onDismiss={dismissStreakTrigger}
      />
      <BookAnalyticsModal
        visible={analyticsModalVisible}
        onClose={() => setAnalyticsModalVisible(false)}
        book={currentBook}
      />
      <QuickSwitchBookModal
        visible={switchBookModalVisible}
        onClose={() => setSwitchBookModalVisible(false)}
      />
      {/* XP & Achievement modals — shown above everything else */}
      <LevelUpModal levelInfo={levelUpInfo} onDismiss={dismissLevelUp} />
      {pendingAchievements.length > 0 && !levelUpInfo && (
        <AchievementUnlockModal
          pending={pendingAchievements}
          onDismiss={dismissPendingAchievement}
        />
      )}
      
      {/* New Detail Modals */}
      <StreakDetailModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
    flexGrow: 1,
  },

  /* Greeting */
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 26,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249,115,22,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F97316',
  },
  streakFlame: {
    fontSize: 17,
    lineHeight: 20,
  },
  streakFlameWrap: {
    marginRight: 2,
  },

  /* Book Card */
  bookCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCardCompact: {
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bookTouchable: {
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  switchBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
  },
  switchBookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookCover: {
    width: 50,
    height: 70,
    borderRadius: 6,
    marginRight: SPACING.md,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverCompact: {
    width: 32,
    height: 44,
    borderRadius: 4,
    marginRight: SPACING.sm,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
  },
  bookTitleCompact: {
    fontSize: 15,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  progressPct: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    fontFamily: FONTS.serif,
    marginLeft: SPACING.sm,
  },
  progressPctCompact: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
    fontFamily: FONTS.serif,
    marginLeft: SPACING.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  progressMetaText: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  completionText: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 44,
    gap: 8,
  },
  logBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: SPACING.md,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
