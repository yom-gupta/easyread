import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getLevelFromXP,
  getLevelProgress,
  getXPForAction,
  LevelInfo,
} from '../utils/xpHelpers';
import {
  checkAchievements,
  getAchievementById,
  perBookId,
  AchievementCheckState,
} from '../utils/achievementHelpers';

// ─────────────────────────────────────────────
//  DATA INTERFACES
// ─────────────────────────────────────────────

export interface Book {
  bookId: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;
  status: 'reading' | 'completed';
  startedAt: string;
  completedAt?: string;
  coverUrl?: string;
  isBookmarked?: boolean;
  bookAchievements: string[];   // per-book achievement IDs earned for THIS copy
  totalSessions: number;
}

export interface ProgressLog {
  id: string;
  bookId: string;
  dateString: string; // YYYY-MM-DD
  pagesReadDelta: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;

  // Streak
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;           // YYYY-MM-DD
  streakFreezeAvailable: number;  // max 2
  streakFreezeUsedToday: boolean;

  // Smart Goal Engine
  rollingPageAverage: number;
  baselineGoal: number;
  currentGoal: number;

  // XP & Level
  totalXP: number;
  level: number;                  // 1–10

  // Counts
  achievements: string[];
  totalPagesRead: number;
  totalBooksFinished: number;

  // Social
  vocabSharedCount: number;
  consecutiveGoalDays: number;
}

export interface DefinitionResult {
  word: string;
  phonetic?: string;
  definition: string;
  partOfSpeech: string;
  audioUrl?: string;
  bookId?: string;
  bookTitle?: string;
  pageLearned?: number;
  dateLearned?: string;
  // Mastery tracking (Phase 2 quiz system)
  status?: 'new' | 'learning' | 'mastered';
  quizAttempts?: number;
  quizPasses?: number;
}

export interface StreakTrigger {
  visible: boolean;
  count: number;
  isBreak: boolean;
  wasFrozen?: boolean;
}

export interface PendingAchievement {
  id: string;
  isPehlaKitaab?: boolean;
  bookTitle?: string;
}

export interface ReadingContextType {
  bookReadLog: Record<string, Record<string, number>>;
  readingMarkers: Record<string, number[]>;
  user: UserProfile;
  books: Book[];
  logs: ProgressLog[];
  currentBook: Book | null;
  streakWasProtectedYesterday: boolean;
  showFirstBookCelebration: boolean;
  vocabNotebook: DefinitionResult[];
  streakTrigger: StreakTrigger | null;
  pendingAchievements: PendingAchievement[];
  levelUpInfo: LevelInfo | null;
  dismissStreakTrigger: () => void;
  dismissPendingAchievement: () => void;
  dismissLevelUp: () => void;
  updateProgress: (bookId: string, newPage: number) => void;
  addBook: (title: string, author: string, totalPages: number, coverUrl?: string) => void;
  dismissCelebration: () => void;
  dismissProtectionBanner: () => void;
  simulateSkipDay: () => void;
  simulateThreeLowEntries: () => void;
  resetSimulation: () => void;
  getEstimatedCompletionDate: (book: Book) => string;
  saveWord: (word: DefinitionResult) => void;
  removeWord: (word: string) => void;
  isWordSaved: (word: string) => boolean;
  setCurrentBook: (bookId: string) => void;
  updateGoal: (goal: number) => void;
  toggleBookmark: (bookId: string) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function getTodayString(): string {
  return getRelativeDateString(0);
}

function getUniqueReadingDaysCount(
  currentLogs: ProgressLog[],
  startOffset: number,
  endOffset: number,
): number {
  const dates = new Set<string>();
  for (let i = startOffset; i <= endOffset; i++) {
    dates.add(getRelativeDateString(i));
  }
  const loggedDays = currentLogs.filter(
    log => dates.has(log.dateString) && log.pagesReadDelta > 0,
  );
  return new Set(loggedDays.map(l => l.dateString)).size;
}

function buildBookReadLogFromLogs(
  logs: ProgressLog[],
): Record<string, Record<string, number>> {
  return logs.reduce<Record<string, Record<string, number>>>((acc, log) => {
    const bookLog = acc[log.bookId] || {};
    bookLog[log.dateString] = (bookLog[log.dateString] || 0) + log.pagesReadDelta;
    acc[log.bookId] = bookLog;
    return acc;
  }, {});
}

// ─────────────────────────────────────────────
//  INITIAL DATA
// ─────────────────────────────────────────────

const INITIAL_BOOKS: Book[] = [
  {
    bookId: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 200,
    pagesRead: 90,
    status: 'reading',
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    bookAchievements: [],
    totalSessions: 5,
  },
  {
    bookId: 'book-2',
    title: 'Deep Work',
    author: 'Cal Newport',
    totalPages: 300,
    pagesRead: 45,
    status: 'reading',
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400',
    bookAchievements: [],
    totalSessions: 3,
  },
  {
    bookId: 'book-3',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    totalPages: 490,
    pagesRead: 120,
    status: 'reading',
    startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    bookAchievements: [],
    totalSessions: 4,
  },
  {
    bookId: 'book-4',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    totalPages: 310,
    pagesRead: 310,
    status: 'completed',
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    coverUrl: 'https://images.unsplash.com/photo-1629752187687-3d3c7ea3a21b?w=400',
    bookAchievements: ['book-4__pehla_kitaab'],
    totalSessions: 12,
  },
];

const INITIAL_USER: UserProfile = {
  uid: 'user-1',
  displayName: 'Rishabh',
  email: 'yom@example.com',
  createdAt: new Date().toISOString(),
  currentStreak: 5,
  longestStreak: 5,
  lastReadDate: getTodayString(),
  streakFreezeAvailable: 2,
  streakFreezeUsedToday: false,
  rollingPageAverage: 10,
  baselineGoal: 15,
  currentGoal: 15,
  totalXP: 250,
  level: 2,
  achievements: ['book-4__pehla_kitaab', 'pehla_qadam'],
  totalPagesRead: 555,
  totalBooksFinished: 1,
  vocabSharedCount: 0,
  consecutiveGoalDays: 0,
};

const INITIAL_LOGS: ProgressLog[] = [
  { id: 'log-1', bookId: 'book-1', dateString: getRelativeDateString(-4), pagesReadDelta: 10 },
  { id: 'log-2', bookId: 'book-1', dateString: getRelativeDateString(-3), pagesReadDelta: 12 },
  { id: 'log-3', bookId: 'book-1', dateString: getRelativeDateString(-2), pagesReadDelta: 8 },
  { id: 'log-4', bookId: 'book-1', dateString: getRelativeDateString(-1), pagesReadDelta: 15 },
  { id: 'log-5', bookId: 'book-1', dateString: getRelativeDateString(0), pagesReadDelta: 10 },
  { id: 'log-6', bookId: 'book-2', dateString: getRelativeDateString(-3), pagesReadDelta: 20 },
  { id: 'log-7', bookId: 'book-2', dateString: getRelativeDateString(-1), pagesReadDelta: 25 },
  { id: 'log-8', bookId: 'book-3', dateString: getRelativeDateString(-5), pagesReadDelta: 15 },
  { id: 'log-9', bookId: 'book-3', dateString: getRelativeDateString(-2), pagesReadDelta: 18 },
  { id: 'log-10', bookId: 'book-4', dateString: getRelativeDateString(-10), pagesReadDelta: 40 },
  { id: 'log-11', bookId: 'book-4', dateString: getRelativeDateString(-8), pagesReadDelta: 50 },
];

const INITIAL_READING_MARKERS: Record<string, number[]> = {
  'book-1': [45, 67, 90],
  'book-2': [45],
  'book-3': [80, 120],
  'book-4': [150, 250, 310],
};

// ─────────────────────────────────────────────
//  PROVIDER
// ─────────────────────────────────────────────

export const ReadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [bookReadLog, setBookReadLog] = useState<Record<string, Record<string, number>>>(
    () => buildBookReadLogFromLogs(INITIAL_LOGS),
  );
  const [readingMarkers, setReadingMarkers] = useState<Record<string, number[]>>(
    INITIAL_READING_MARKERS,
  );
  const [logs, setLogs] = useState<ProgressLog[]>(INITIAL_LOGS);
  const [streakWasProtectedYesterday, setStreakWasProtectedYesterday] =
    useState<boolean>(false);
  const [showFirstBookCelebration, setShowFirstBookCelebration] =
    useState<boolean>(false);
  const [vocabNotebook, setVocabNotebook] = useState<DefinitionResult[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>('book-1');
  const [streakTrigger, setStreakTrigger] = useState<StreakTrigger | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<PendingAchievement[]>([]);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelInfo | null>(null);

  // ── Derived ──────────────────────────────────────────────────
  const currentBook =
    books.find(b => b.bookId === currentBookId && b.status === 'reading') ||
    books.find(b => b.status === 'reading') ||
    books[0] ||
    null;

  // ── Vocab helpers ─────────────────────────────────────────────
  const saveWord = (word: DefinitionResult) => {
    if (!isWordSaved(word.word)) {
      const activeBook = currentBook;
      const enhancedWord: DefinitionResult = {
        ...word,
        bookId: activeBook?.bookId,
        bookTitle: activeBook?.title,
        pageLearned: activeBook?.pagesRead,
        dateLearned: new Date().toISOString(),
        status: 'new',
        quizAttempts: 0,
        quizPasses: 0,
      };
      setVocabNotebook(prev => [...prev, enhancedWord]);

      // +5 XP for saving a word
      addXPInternal('word_added', 1);
    }
  };

  const isWordSaved = (word: string): boolean =>
    vocabNotebook.some(item => item.word.toLowerCase() === word.toLowerCase());

  const removeWord = (word: string) => {
    setVocabNotebook(prev =>
      prev.filter(item => item.word.toLowerCase() !== word.toLowerCase()),
    );
  };

  const toggleBookmark = (bookId: string) => {
    setBooks(prev =>
      prev.map(b =>
        b.bookId === bookId ? { ...b, isBookmarked: !b.isBookmarked } : b,
      ),
    );
  };

  const setCurrentBook = (bookId: string) => {
    const target = books.find(b => b.bookId === bookId);
    if (target) {
      setCurrentBookId(bookId);
      if (target.status !== 'reading') {
        setBooks(prev =>
          prev.map(b =>
            b.bookId === bookId ? { ...b, status: 'reading' as const } : b,
          ),
        );
      }
    }
  };

  const updateGoal = (goal: number) => {
    setUser(prev => ({ ...prev, baselineGoal: goal, currentGoal: goal }));
  };

  // ── XP / Level ────────────────────────────────────────────────
  const addXPInternal = (
    action: Parameters<typeof getXPForAction>[0],
    quantity = 1,
    currentUserOverride?: UserProfile,
  ) => {
    setUser(prev => {
      const base = currentUserOverride || prev;
      const gain = getXPForAction(action, quantity);
      const newXP = base.totalXP + gain;
      const oldLevel = getLevelFromXP(base.totalXP);
      const newLevel = getLevelFromXP(newXP);

      let newFreezeTokens = base.streakFreezeAvailable;

      // +1 freeze token on level-up (capped at 2)
      if (newLevel.level > oldLevel.level) {
        newFreezeTokens = Math.min(2, newFreezeTokens + 1);
        // Show level-up modal (async)
        setLevelUpInfo(newLevel);
      }

      return {
        ...prev,
        totalXP: newXP,
        level: newLevel.level,
        streakFreezeAvailable: newFreezeTokens,
      };
    });
  };

  // ── Achievement ───────────────────────────────────────────────
  const unlockAchievements = (
    ids: string[],
    updatedUser: UserProfile,
    updatedBooks: Book[],
    updatedVocab: DefinitionResult[],
    completedBookId?: string,
  ) => {
    if (ids.length === 0) return;

    const newPending: PendingAchievement[] = ids.map(id => {
      const isPehla = id.endsWith('__pehla_kitaab');
      const completedBook = completedBookId
        ? updatedBooks.find(b => b.bookId === completedBookId)
        : undefined;
      return {
        id,
        isPehlaKitaab: isPehla,
        bookTitle: completedBook?.title,
      };
    });

    // Add earned IDs to user.achievements
    setUser(prev => ({
      ...prev,
      achievements: [...new Set([...prev.achievements, ...ids])],
    }));

    // Award XP for each achievement
    ids.forEach(() => {
      addXPInternal('achievement', 1);
    });

    setPendingAchievements(prev => [...prev, ...newPending]);
  };

  const dismissPendingAchievement = () => {
    setPendingAchievements(prev => prev.slice(1));
  };

  const dismissLevelUp = () => {
    setLevelUpInfo(null);
  };

  // ── Book completion helpers ────────────────────────────────────
  const checkFirstBookCompletion = (updatedBooks: Book[]) => {
    const completedCount = updatedBooks.filter(b => b.status === 'completed').length;
    if (completedCount === 1) {
      setShowFirstBookCelebration(true);
    }
  };

  // ── Smart Goal Engine ─────────────────────────────────────────
  const calculateRollingAverage = (currentLogs: ProgressLog[]): number => {
    const last5Days = Array.from({ length: 5 }, (_, i) => getRelativeDateString(-i));
    const recentLogs = currentLogs.filter(log => last5Days.includes(log.dateString));
    if (recentLogs.length === 0) return 10;
    const totalPagesRead = recentLogs.reduce((sum, log) => sum + log.pagesReadDelta, 0);
    const uniqueDaysRead = new Set(recentLogs.map(log => log.dateString)).size;
    const average = uniqueDaysRead > 0 ? totalPagesRead / uniqueDaysRead : 10;
    return Math.max(1, Math.round(average * 10) / 10);
  };

  const getEstimatedCompletionDate = (book: Book): string => {
    if (book.status === 'completed' || book.pagesRead >= book.totalPages) {
      return 'Completed';
    }
    const remainingPages = book.totalPages - book.pagesRead;
    const speed = user.rollingPageAverage > 0 ? user.rollingPageAverage : 10;
    const remainingDays = Math.ceil(remainingPages / speed);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + remainingDays);
    return completionDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ── Main updateProgress ───────────────────────────────────────
  const updateProgress = (bookId: string, newPage: number) => {
    const book = books.find(b => b.bookId === bookId);
    if (!book) return;

    const previousPage = book.pagesRead;
    const delta = newPage - previousPage;
    if (delta <= 0) return;

    const todayStr = getTodayString();
    const logHour = new Date().getHours();

    // Was today already logged before this update?
    const readTodayBeforeUpdate = logs.some(
      l => l.dateString === todayStr && l.pagesReadDelta > 0,
    );

    // Update bookReadLog
    setBookReadLog(prev => {
      const bookLog = prev[bookId] || {};
      const existing = bookLog[todayStr] || 0;
      return {
        ...prev,
        [bookId]: { ...bookLog, [todayStr]: existing + delta },
      };
    });

    // Update reading markers
    setReadingMarkers(prev => {
      const existing = prev[bookId] || [];
      const page = Math.min(newPage, book.totalPages);
      if (existing.includes(page)) return prev;
      return { ...prev, [bookId]: [...existing, page].sort((a, b) => a - b) };
    });

    // Update books
    const isBookBeingCompleted = newPage >= book.totalPages && previousPage < book.totalPages;
    const updatedBooks = books.map(b => {
      if (b.bookId === bookId) {
        const isFinished = newPage >= b.totalPages;
        return {
          ...b,
          pagesRead: Math.min(newPage, b.totalPages),
          status: isFinished ? ('completed' as const) : b.status,
          completedAt: isFinished ? new Date().toISOString() : b.completedAt,
          totalSessions: b.totalSessions + 1,
        };
      }
      return b;
    });
    setBooks(updatedBooks);

    if (isBookBeingCompleted) {
      checkFirstBookCompletion(updatedBooks);
    }

    // Update logs
    let updatedLogs = [...logs];
    const existingLogIdx = logs.findIndex(
      l => l.bookId === bookId && l.dateString === todayStr,
    );
    if (existingLogIdx > -1) {
      updatedLogs[existingLogIdx] = {
        ...updatedLogs[existingLogIdx],
        pagesReadDelta: updatedLogs[existingLogIdx].pagesReadDelta + delta,
      };
    } else {
      updatedLogs.push({
        id: `log-${Date.now()}`,
        bookId,
        dateString: todayStr,
        pagesReadDelta: delta,
      });
    }
    setLogs(updatedLogs);

    // Rolling average + smart goal
    const newRollingAvg = calculateRollingAverage(updatedLogs);
    const uniqueLogsByDate = updatedLogs.reduce((acc: Record<string, number>, cur) => {
      acc[cur.dateString] = (acc[cur.dateString] || 0) + cur.pagesReadDelta;
      return acc;
    }, {});
    const sortedDates = Object.keys(uniqueLogsByDate).sort((a, b) =>
      b.localeCompare(a),
    );
    const last3DaysLogs = sortedDates
      .slice(0, 3)
      .map(date => uniqueLogsByDate[date]);

    let newCurrentGoal = user.baselineGoal;
    if (
      last3DaysLogs.length >= 3 &&
      last3DaysLogs.every(val => val < user.baselineGoal)
    ) {
      const averageRead = last3DaysLogs.reduce((s, v) => s + v, 0) / 3;
      const deviation = user.baselineGoal - averageRead;
      const calculatedGoal = user.baselineGoal - deviation * 0.2;
      newCurrentGoal = Math.max(1, Math.round(calculatedGoal));
    } else {
      const loggedToday = uniqueLogsByDate[todayStr] || 0;
      if (loggedToday >= user.baselineGoal) {
        newCurrentGoal = user.baselineGoal;
      } else {
        newCurrentGoal = user.currentGoal;
      }
    }

    // Daily goal hit?
    const totalTodayPages = (uniqueLogsByDate[todayStr] || 0);
    const goalHitToday =
      totalTodayPages >= user.currentGoal &&
      (totalTodayPages - delta) < user.currentGoal; // just crossed the goal

    // Consecutive goal days
    let newConsecutiveGoalDays = user.consecutiveGoalDays;
    if (goalHitToday) {
      newConsecutiveGoalDays += 1;
    }

    // ── STREAK EVALUATION ─────────────────────────────────────
    let nextStreak = user.currentStreak;
    let triggerAnimation: StreakTrigger | null = null;
    let nextFreezeTokens = user.streakFreezeAvailable;
    let freezeUsedToday = user.streakFreezeUsedToday;
    let nextLastReadDate = user.lastReadDate;

    if (!readTodayBeforeUpdate) {
      nextLastReadDate = todayStr;
      const yesterdayStr = getRelativeDateString(-1);
      const readYesterday = updatedLogs.some(
        l => l.dateString === yesterdayStr && l.pagesReadDelta > 0,
      );

      if (readYesterday) {
        nextStreak = user.currentStreak + 1;
        triggerAnimation = { visible: true, count: nextStreak, isBreak: false };
      } else {
        const uniqueDaysLastWeekCount = getUniqueReadingDaysCount(
          updatedLogs, -7, -1,
        );
        if (uniqueDaysLastWeekCount >= 3) {
          nextStreak = user.currentStreak + 1;
          triggerAnimation = { visible: true, count: nextStreak, isBreak: false, wasFrozen: true };
        } else if (nextFreezeTokens > 0) {
          nextFreezeTokens -= 1;
          freezeUsedToday = true;
          nextStreak = user.currentStreak + 1;
          triggerAnimation = { visible: true, count: nextStreak, isBreak: false, wasFrozen: true };
        } else {
          nextStreak = 1;
          triggerAnimation = { visible: true, count: nextStreak, isBreak: true };
        }
      }

      // +1 freeze token on every 2-day streak milestone (capped at 2)
      if (nextStreak > 0 && nextStreak % 2 === 0 && !triggerAnimation?.isBreak) {
        nextFreezeTokens = Math.min(2, nextFreezeTokens + 1);
      }
    }

    const newLongestStreak = Math.max(user.longestStreak, nextStreak);

    // ── XP for pages ──────────────────────────────────────────
    const pageXP = getXPForAction('page_read', delta);
    const goalBonusXP = goalHitToday ? getXPForAction('daily_goal_hit') : 0;
    const bookCompletionXP = isBookBeingCompleted ? getXPForAction('book_completed') : 0;
    const streakXP =
      nextStreak === 7
        ? getXPForAction('streak_7')
        : nextStreak === 14
        ? getXPForAction('streak_14')
        : nextStreak === 30
        ? getXPForAction('streak_30')
        : 0;

    const totalXPGain = pageXP + goalBonusXP + bookCompletionXP + streakXP;
    const newTotalXP = user.totalXP + totalXPGain;
    const oldLevel = getLevelFromXP(user.totalXP);
    const newLevelInfo = getLevelFromXP(newTotalXP);

    // +1 freeze token on level-up
    let levelUpFreezeBonus = 0;
    if (newLevelInfo.level > oldLevel.level) {
      levelUpFreezeBonus = 1;
      setLevelUpInfo(newLevelInfo);
    }
    nextFreezeTokens = Math.min(2, nextFreezeTokens + levelUpFreezeBonus);

    const newTotalPagesRead = user.totalPagesRead + delta;
    const newTotalBooksFinished =
      user.totalBooksFinished + (isBookBeingCompleted ? 1 : 0);

    // Prepare updated user (for achievement check)
    const updatedUser: UserProfile = {
      ...user,
      rollingPageAverage: newRollingAvg,
      currentGoal: newCurrentGoal,
      currentStreak: nextStreak,
      longestStreak: newLongestStreak,
      lastReadDate: nextLastReadDate,
      streakFreezeAvailable: nextFreezeTokens,
      streakFreezeUsedToday: freezeUsedToday,
      totalXP: newTotalXP,
      level: newLevelInfo.level,
      totalPagesRead: newTotalPagesRead,
      totalBooksFinished: newTotalBooksFinished,
      consecutiveGoalDays: newConsecutiveGoalDays,
    };
    setUser(updatedUser);

    if (triggerAnimation) {
      setStreakTrigger(triggerAnimation);
    }

    // ── Achievement check ─────────────────────────────────────
    const activeBook = updatedBooks.find(b => b.bookId === bookId);
    const activeBookDaysLogged = new Set(
      updatedLogs.filter(l => l.bookId === bookId).map(l => l.dateString),
    ).size;
    const activeBookVocabCount = vocabNotebook.filter(
      v => v.bookId === bookId,
    ).length;

    // Days since last read (before today)
    const lastReadDate = user.lastReadDate;
    const todayDate = new Date(todayStr);
    const lastDate = new Date(lastReadDate);
    const daysSinceLastRead =
      Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

    const weeklyPages = Object.entries(uniqueLogsByDate)
      .filter(([date]) => {
        const d = new Date(date + 'T00:00:00');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      })
      .reduce((s, [, v]) => s + v, 0);

    const dailyPages = uniqueLogsByDate[todayStr] || 0;
    const isFirstEverBook =
      updatedBooks.filter(b => b.status === 'completed').length === 1 &&
      isBookBeingCompleted;

    const achState: AchievementCheckState = {
      totalXP: newTotalXP,
      currentStreak: nextStreak,
      totalBooksFinished: newTotalBooksFinished,
      totalPagesRead: newTotalPagesRead,
      achievements: updatedUser.achievements,
      vocabCount: vocabNotebook.length,
      masteredWordCount: vocabNotebook.filter(w => w.status === 'mastered').length,
      weeklyPages,
      dailyPages,
      consecutiveGoalDays: newConsecutiveGoalDays,
      vocabSharedCount: user.vocabSharedCount,
      streakFreezeUsedToday: freezeUsedToday,
      daysSinceLastRead,
      logHour,
      activeBookId: bookId,
      activeBookPagesRead: activeBook?.pagesRead || 0,
      activeBookTotalPages: activeBook?.totalPages || 0,
      activeBookDaysLogged,
      activeBookVocabCount,
      activeBookStartedAt: activeBook?.startedAt || new Date().toISOString(),
      isFirstEverBook,
      isBookJustCompleted: isBookBeingCompleted,
    };

    const newAchievements = checkAchievements(achState);
    if (newAchievements.length > 0) {
      unlockAchievements(newAchievements, updatedUser, updatedBooks, vocabNotebook, bookId);
    }
  };

  const addBook = (
    title: string,
    author: string,
    totalPages: number,
    coverUrl?: string,
  ) => {
    const id = `book-${Date.now()}`;
    const newBook: Book = {
      bookId: id,
      title,
      author,
      totalPages,
      pagesRead: 0,
      status: 'reading',
      startedAt: new Date().toISOString(),
      coverUrl,
      bookAchievements: [],
      totalSessions: 0,
    };
    setBooks(prev => [newBook, ...prev]);
    setCurrentBookId(id);
  };

  const dismissCelebration = () => setShowFirstBookCelebration(false);
  const dismissProtectionBanner = () => setStreakWasProtectedYesterday(false);
  const dismissStreakTrigger = () => setStreakTrigger(null);

  // ── SIMULATION HANDLERS ────────────────────────────────────────
  const simulateSkipDay = () => {
    const uniqueDaysLastWeekCount = getUniqueReadingDaysCount(logs, -6, 0);
    if (uniqueDaysLastWeekCount >= 3) {
      setStreakWasProtectedYesterday(true);
    } else if (user.streakFreezeAvailable > 0) {
      setUser(prev => ({
        ...prev,
        streakFreezeAvailable: prev.streakFreezeAvailable - 1,
        streakFreezeUsedToday: true,
      }));
      setStreakWasProtectedYesterday(true);
    } else {
      setUser(prev => ({ ...prev, currentStreak: 0 }));
      setStreakWasProtectedYesterday(false);
      setStreakTrigger({ visible: true, count: 0, isBreak: true });
    }
  };

  const simulateThreeLowEntries = () => {
    const tempLogs = [...logs];
    const dayMinus2 = getRelativeDateString(-2);
    const dayMinus1 = getRelativeDateString(-1);
    const dayToday = getRelativeDateString(0);
    let filteredLogs = tempLogs.filter(
      l =>
        l.dateString !== dayMinus2 &&
        l.dateString !== dayMinus1 &&
        l.dateString !== dayToday,
    );
    filteredLogs.push({
      id: 'sim-log-1',
      bookId: 'book-1',
      dateString: dayMinus2,
      pagesReadDelta: 3,
    });
    filteredLogs.push({
      id: 'sim-log-2',
      bookId: 'book-1',
      dateString: dayMinus1,
      pagesReadDelta: 2,
    });
    filteredLogs.push({
      id: 'sim-log-3',
      bookId: 'book-1',
      dateString: dayToday,
      pagesReadDelta: 4,
    });
    setLogs(filteredLogs);
    const averageRead = (3 + 2 + 4) / 3;
    const deviation = user.baselineGoal - averageRead;
    const calculatedGoal = user.baselineGoal - deviation * 0.2;
    const adjustedGoal = Math.max(1, Math.round(calculatedGoal));
    const newRollingAvg = calculateRollingAverage(filteredLogs);
    setBooks(prev =>
      prev.map(b =>
        b.bookId === 'book-1'
          ? { ...b, pagesRead: 99, status: 'reading' as const }
          : b,
      ),
    );
    setUser(prev => ({
      ...prev,
      rollingPageAverage: newRollingAvg,
      currentGoal: adjustedGoal,
    }));
  };

  const resetSimulation = () => {
    setUser(INITIAL_USER);
    setBooks(INITIAL_BOOKS);
    setLogs(INITIAL_LOGS);
    setBookReadLog(buildBookReadLogFromLogs(INITIAL_LOGS));
    setReadingMarkers(INITIAL_READING_MARKERS);
    setStreakWasProtectedYesterday(false);
    setShowFirstBookCelebration(false);
    setStreakTrigger(null);
    setPendingAchievements([]);
    setLevelUpInfo(null);
  };

  return (
    <ReadingContext.Provider
      value={{
        user,
        books,
        logs,
        currentBook,
        streakWasProtectedYesterday,
        showFirstBookCelebration,
        vocabNotebook,
        bookReadLog,
        readingMarkers,
        streakTrigger,
        pendingAchievements,
        levelUpInfo,
        dismissStreakTrigger,
        dismissPendingAchievement,
        dismissLevelUp,
        updateProgress,
        addBook,
        dismissCelebration,
        dismissProtectionBanner,
        simulateSkipDay,
        simulateThreeLowEntries,
        resetSimulation,
        getEstimatedCompletionDate,
        saveWord,
        removeWord,
        isWordSaved,
        setCurrentBook,
        updateGoal,
        toggleBookmark,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
};

export const useReading = () => {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
};
