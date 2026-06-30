import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading, Book, ProgressLog } from '../context/ReadingContext';
import { BookAnalyticsModal } from '../components/BookAnalyticsModal';

function getDayLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function formatDateString(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatSessionWhen(dateStr: string): { primary: string; secondary: string } {
  const today = getRelativeDateString(0);
  const yesterday = getRelativeDateString(-1);
  const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (dateStr === today) {
    return { primary: 'Today', secondary: formatted };
  }
  if (dateStr === yesterday) {
    return { primary: 'Yesterday', secondary: formatted };
  }
  return { primary: formatDateString(dateStr), secondary: formatted };
}

function sortLogsNewestFirst(logs: ProgressLog[]): ProgressLog[] {
  return [...logs].sort((a, b) => {
    const dateCompare = b.dateString.localeCompare(a.dateString);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });
}

function SectionHeader({
  icon,
  title,
  subtitle,
  iconColor = COLORS.accent,
  iconBg = 'rgba(74, 124, 89, 0.1)',
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  iconColor?: string;
  iconBg?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
      <View style={[styles.sectionIconWrap, compact && styles.sectionIconWrapCompact, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={compact ? 13 : 16} color={iconColor} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, compact && styles.sectionSubtitleCompact]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const AnalyticsScreen: React.FC = () => {
  const { user, logs, books } = useReading();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [allBooksModalVisible, setAllBooksModalVisible] = useState(false);

  const allBooksSlideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const allBooksFadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (allBooksModalVisible) {
      Animated.parallel([
        Animated.spring(allBooksSlideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(allBooksFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(allBooksSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(allBooksFadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [allBooksModalVisible]);

  const bookById = useMemo(
    () => new Map(books.map(b => [b.bookId, b])),
    [books],
  );

  const recentSessions = useMemo(() => sortLogsNewestFirst(logs).slice(0, 10), [logs]);

  const openBookAnalytics = (book: Book | undefined) => {
    if (!book) return;
    setSelectedBook(book);
    setAnalyticsModalVisible(true);
  };

  // Last 7 days for the main bar chart
  const last7Days = Array.from({ length: 7 }, (_, i) => getRelativeDateString(-(6 - i)));
  const pagesByDay = last7Days.map(dateStr => {
    const dayLogs = logs.filter(l => l.dateString === dateStr);
    return {
      date: dateStr,
      label: getDayLabel(dateStr),
      pages: dayLogs.reduce((sum, l) => sum + l.pagesReadDelta, 0),
      isToday: dateStr === getRelativeDateString(0),
      metGoal: dayLogs.reduce((sum, l) => sum + l.pagesReadDelta, 0) >= user.currentGoal,
    };
  });

  const maxPages = Math.max(...pagesByDay.map(d => d.pages), user.currentGoal, 1);
  const chartBarMaxHeight = 100;

  const totalPagesRead = logs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
  const completedBooks = books.filter(b => b.status === 'completed').length;
  const daysLogged = new Set(logs.map(l => l.dateString)).size;
  const avgPagesPerDay = daysLogged > 0 ? Math.round(totalPagesRead / daysLogged) : 0;

  // GitHub contribution heatmap mapping (Last 35 days / 5 weeks, starting on a Monday)
  const todayDate = new Date();
  const currentDay = todayDate.getDay(); // 0 is Sunday, 1 is Monday
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOffset = -(28 + daysSinceMonday);

  const last35Days = Array.from({ length: 35 }, (_, i) => getRelativeDateString(startOffset + i));
  const heatmapData = last35Days.map(dateStr => {
    const dayLogs = logs.filter(l => l.dateString === dateStr);
    const pages = dayLogs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
    return { dateStr, pages };
  });

  // Split into 5 columns of 7 days (weeks) for the vertical grid
  const heatmapColumns: typeof heatmapData[] = [];
  for (let i = 0; i < 5; i++) {
    heatmapColumns.push(heatmapData.slice(i * 7, (i + 1) * 7));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="analytics" size={20} color={COLORS.accent} />
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>
          <Text style={styles.headerSubtitle}>Your reading journey at a glance</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Overview Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardStreak]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
              <Ionicons name="flame" size={16} color="#F97316" />
            </View>
            <Text style={styles.statValue}>{user.currentStreak}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPages]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <Ionicons name="book" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{totalPagesRead}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
          <View style={[styles.statCard, styles.statCardFinished]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(74, 124, 89, 0.12)' }]}>
              <Ionicons name="checkmark-done" size={16} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{completedBooks}</Text>
            <Text style={styles.statLabel}>Finished</Text>
          </View>
          <View style={[styles.statCard, styles.statCardDays]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
              <Ionicons name="calendar" size={16} color="#EC4899" />
            </View>
            <Text style={styles.statValue}>{daysLogged}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>

        {daysLogged > 0 && (
          <View style={styles.insightBanner}>
            <Ionicons name="trending-up" size={16} color={COLORS.accent} />
            <Text style={styles.insightText}>
              Averaging <Text style={styles.insightHighlight}>{avgPagesPerDay} pages</Text> per active day
            </Text>
          </View>
        )}

        {/* 7-Day Chart */}
        <View style={styles.chartCard}>
          <SectionHeader
            icon="bar-chart-outline"
            title="7-Day Progress"
            subtitle={`Daily target: ${user.currentGoal} pages`}
          />
          <View style={styles.chartContainer}>
            {pagesByDay.map((day) => {
              const barHeight = day.pages > 0
                ? Math.max(8, Math.round((day.pages / maxPages) * chartBarMaxHeight))
                : 0;
              return (
                <View key={day.date} style={styles.chartBarGroup}>
                  <View style={styles.chartBarWrapper}>
                    {day.pages > 0 && (
                      <Text style={styles.chartBarValue}>{day.pages}</Text>
                    )}
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: barHeight,
                            backgroundColor: day.metGoal
                              ? COLORS.accent
                              : day.pages > 0
                                ? 'rgba(74, 124, 89, 0.35)'
                                : COLORS.border,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.chartDayLabel, day.isToday && styles.chartDayLabelToday]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Goal Met</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(74, 124, 89, 0.35)' }]} />
              <Text style={styles.legendText}>Below Goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.legendText}>No Activity</Text>
            </View>
          </View>
        </View>

        {/* Reading Intensity + Books Performance — side by side */}
        <View style={styles.chartCard}>
          <View style={styles.splitRow}>
            {/* Left: Reading Intensity */}
            <View style={styles.splitColumnLeft}>
              <SectionHeader
                icon="grid-outline"
                title="Intensity"
                subtitle="Last 5 weeks"
                iconColor="#0EA5E9"
                iconBg="rgba(14, 165, 233, 0.12)"
                compact
              />
              <View style={styles.heatmapCardContent}>
                <View style={styles.heatmapContainer}>
                  <View style={styles.weekdayLabels}>
                    <View style={styles.weekdayLabelCell}><Text style={styles.weekdayText}>M</Text></View>
                    <View style={styles.weekdayLabelCell} />
                    <View style={styles.weekdayLabelCell}><Text style={styles.weekdayText}>W</Text></View>
                    <View style={styles.weekdayLabelCell} />
                    <View style={styles.weekdayLabelCell}><Text style={styles.weekdayText}>F</Text></View>
                    <View style={styles.weekdayLabelCell} />
                    <View style={styles.weekdayLabelCell} />
                  </View>
                  <View style={styles.heatmapGrid}>
                    {heatmapColumns.map((column, colIdx) => (
                      <View key={colIdx} style={styles.heatmapColumn}>
                        {column.map((day) => {
                          let color = '#F3F4F6';
                          if (day.pages > 20) color = 'rgba(74, 124, 89, 0.95)';
                          else if (day.pages > 10) color = 'rgba(74, 124, 89, 0.65)';
                          else if (day.pages > 0) color = 'rgba(74, 124, 89, 0.3)';
                          return (
                            <View
                              key={day.dateStr}
                              style={[styles.heatmapCell, { backgroundColor: color }]}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.heatmapLegend}>
                  <Text style={styles.legendLabel}>Less</Text>
                  <View style={[styles.legendSquare, { backgroundColor: '#F3F4F6' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: 'rgba(74, 124, 89, 0.3)' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: 'rgba(74, 124, 89, 0.65)' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: 'rgba(74, 124, 89, 0.95)' }]} />
                  <Text style={styles.legendLabel}>More</Text>
                </View>
              </View>
            </View>

            <View style={styles.splitDivider} />

            {/* Right: Books Performance */}
            <View style={styles.splitColumnRight}>
              <TouchableOpacity
                onPress={() => setAllBooksModalVisible(true)}
                activeOpacity={0.7}
              >
                <SectionHeader
                  icon="library-outline"
                  title="Books"
                  subtitle={`${books.length} in library`}
                  iconColor="#D97706"
                  iconBg="rgba(217, 119, 6, 0.12)"
                  compact
                />
              </TouchableOpacity>
              {books.length === 0 ? (
                <View style={styles.emptyStateCompact}>
                  <Ionicons name="library-outline" size={22} color={COLORS.border} />
                  <Text style={styles.emptyLogTextCompact}>No books yet</Text>
                </View>
              ) : (
                books.slice(0, 3).map((book, idx) => {
                  const bookLogs = logs.filter(l => l.bookId === book.bookId);
                  const totalRead = bookLogs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
                  const pct = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
                  const isLast = idx === Math.min(books.length, 3) - 1;
                  return (
                    <TouchableOpacity
                      key={book.bookId}
                      style={[styles.bookAnalyticsRowCompact, isLast && styles.bookAnalyticsRowLast]}
                      onPress={() => openBookAnalytics(book)}
                      activeOpacity={0.7}
                    >
                      {book.coverUrl ? (
                        <Image source={{ uri: book.coverUrl }} style={styles.bookAnalyticsCoverCompact} />
                      ) : (
                        <View style={styles.bookAnalyticsPlaceholderCompact}>
                          <Ionicons name="book" size={11} color={COLORS.accent} />
                        </View>
                      )}
                      <View style={styles.bookAnalyticsInfoCompact}>
                        <Text style={styles.bookAnalyticsTitleCompact} numberOfLines={2}>{book.title}</Text>
                        <Text style={styles.bookAnalyticsMetaCompact}>
                          {book.status === 'completed' ? 'Done' : `${pct}%`} · {totalRead}p
                        </Text>
                        {book.status !== 'completed' && (
                          <View style={styles.bookProgressTrackCompact}>
                            <View style={[styles.bookProgressFill, { width: `${pct}%` }]} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              {books.length > 3 && (
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => setAllBooksModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See All Books ({books.length})</Text>
                  <Ionicons name="arrow-forward" size={12} color={COLORS.accent} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Recent Sessions — bottom */}
        <View style={styles.chartCard}>
          <SectionHeader
            icon="time-outline"
            title="Recent Sessions"
            subtitle="What you read and when"
            iconColor="#6366F1"
            iconBg="rgba(99, 102, 241, 0.12)"
          />
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={28} color={COLORS.border} />
              <Text style={styles.emptyLogText}>No reading sessions logged yet.</Text>
              <Text style={styles.emptyLogHint}>Update your page progress to start tracking.</Text>
            </View>
          ) : (
            recentSessions.map((log, idx) => {
              const book = bookById.get(log.bookId);
              const when = formatSessionWhen(log.dateString);
              const isLast = idx === recentSessions.length - 1;
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[styles.sessionRow, isLast && styles.sessionRowLast]}
                  onPress={() => openBookAnalytics(book)}
                  activeOpacity={book ? 0.7 : 1}
                  disabled={!book}
                >
                  {book?.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} style={styles.sessionCover} />
                  ) : (
                    <View style={styles.sessionCoverPlaceholder}>
                      <Ionicons name="book" size={16} color={COLORS.accent} />
                    </View>
                  )}
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionBookTitle} numberOfLines={1}>
                      {book?.title ?? 'Unknown Book'}
                    </Text>
                    <View style={styles.sessionMetaRow}>
                      <Text style={styles.sessionWhenPrimary}>{when.primary}</Text>
                      <Text style={styles.sessionWhenDot}>·</Text>
                      <Text style={styles.sessionWhenSecondary}>{when.secondary}</Text>
                    </View>
                    {book?.author ? (
                      <Text style={styles.sessionAuthor} numberOfLines={1}>{book.author}</Text>
                    ) : null}
                  </View>
                  <View style={styles.sessionPagesBadge}>
                    <Text style={styles.sessionPagesValue}>+{log.pagesReadDelta}</Text>
                    <Text style={styles.sessionPagesLabel}>pages</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      <BookAnalyticsModal
        visible={analyticsModalVisible}
        onClose={() => setAnalyticsModalVisible(false)}
        book={selectedBook || null}
      />

      {/* Full list of books modal */}
      <Modal
        visible={allBooksModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setAllBooksModalVisible(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: allBooksFadeAnim }]}>
          <TouchableOpacity style={styles.modalDismissOverlay} activeOpacity={1} onPress={() => setAllBooksModalVisible(false)} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalSheetWrapper,
            { transform: [{ translateY: allBooksSlideAnim }] },
          ]}
        >
          <View style={styles.modalHandle} />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Books Performance</Text>
              <TouchableOpacity
                onPress={() => setAllBooksModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {books.map((book) => {
                const bookLogs = logs.filter(l => l.bookId === book.bookId);
                const totalRead = bookLogs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
                const pct = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={book.bookId}
                    style={styles.modalBookRow}
                    onPress={() => {
                      setAllBooksModalVisible(false);
                      openBookAnalytics(book);
                    }}
                    activeOpacity={0.7}
                  >
                    {book.coverUrl ? (
                      <Image source={{ uri: book.coverUrl }} style={styles.modalBookCover} />
                    ) : (
                      <View style={styles.modalBookPlaceholder}>
                        <Ionicons name="book" size={20} color={COLORS.accent} />
                      </View>
                    )}
                    <View style={styles.modalBookInfo}>
                      <Text style={styles.modalBookTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.modalBookAuthor}>{book.author}</Text>
                      <View style={styles.modalBookMetaRow}>
                        <Text style={styles.modalBookPct}>
                          {book.status === 'completed' ? 'Completed' : `${pct}% read`}
                        </Text>
                        <Text style={styles.modalBookDot}>·</Text>
                        <Text style={styles.modalBookPages}>{totalRead} pages logged</Text>
                      </View>
                      {book.status !== 'completed' && (
                        <View style={styles.modalBookProgressTrack}>
                          <View style={[styles.modalBookProgressFill, { width: `${pct}%` }]} />
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTextWrap: {
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginLeft: 28,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardStreak: {},
  statCardPages: {},
  statCardFinished: {},
  statCardDays: {},
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  statLabel: {
    fontSize: 8.5,
    color: COLORS.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bannerBg,
    borderWidth: 1,
    borderColor: COLORS.bannerBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: SPACING.md,
  },
  insightText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '500',
  },
  insightHighlight: {
    fontWeight: '700',
    color: COLORS.accent,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  sectionHeaderCompact: {
    gap: 6,
    marginBottom: SPACING.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconWrapCompact: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  sectionTitleCompact: {
    fontSize: 13,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: COLORS.mutedText,
    marginTop: 1,
  },
  sectionSubtitleCompact: {
    fontSize: 10,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  splitColumn: {
    flex: 1,
    minWidth: 0,
  },
  splitColumnLeft: {
    flex: 1.0,
    minWidth: 0,
  },
  splitColumnRight: {
    flex: 1.0,
    minWidth: 0,
  },
  splitDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
    marginBottom: SPACING.sm,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  chartBarTrack: {
    height: 80,
    width: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartDayLabel: {
    fontSize: 10,
    color: COLORS.mutedText,
    marginTop: 6,
    fontWeight: '500',
  },
  chartDayLabelToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: '500',
  },

  /* Heatmap Styles */
  heatmapCardContent: {
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  heatmapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdayLabels: {
    marginRight: 6,
    gap: 4,
  },
  weekdayLabelCell: {
    height: 18,
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 9.5,
    color: COLORS.mutedText,
    fontWeight: '700',
    textAlign: 'right',
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  heatmapCell: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2.5,
  },

  /* Books Performance — compact (split column) */
  bookAnalyticsRowCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 7,
    alignSelf: 'stretch',
  },
  bookAnalyticsCoverCompact: {
    width: 26,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  bookAnalyticsPlaceholderCompact: {
    width: 26,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookAnalyticsInfoCompact: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  bookAnalyticsTitleCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 14,
    flexShrink: 1,
  },
  bookAnalyticsMetaCompact: {
    fontSize: 9.5,
    color: COLORS.mutedText,
  },
  bookProgressTrackCompact: {
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 1,
  },
  bookAnalyticsRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  bookProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },

  /* Recent Sessions */
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  sessionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  sessionCover: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  sessionCoverPlaceholder: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  sessionBookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  sessionWhenPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  sessionWhenDot: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  sessionWhenSecondary: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  sessionAuthor: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 1,
  },
  sessionPagesBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 52,
  },
  sessionPagesValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
    fontFamily: FONTS.serif,
  },
  sessionPagesLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  /* Empty States */
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: 6,
  },
  emptyLogText: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyLogHint: {
    fontSize: 11.5,
    color: COLORS.mutedText,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyStateCompact: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 4,
  },
  emptyLogTextCompact: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '500',
    textAlign: 'center',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
  },
  seeAllText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: SPACING.md,
  },
  modalBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBookCover: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  modalBookPlaceholder: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBookInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  modalBookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  modalBookAuthor: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  modalBookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalBookPct: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  modalBookDot: {
    marginHorizontal: 4,
    color: COLORS.mutedText,
  },
  modalBookPages: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  modalBookProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  modalBookProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
  },
  modalDismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalContent: {
    flex: 1,
  },
});
