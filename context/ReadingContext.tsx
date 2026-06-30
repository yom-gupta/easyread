import React, { createContext, useContext, useState, useEffect } from 'react';

// Define structures
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
  currentStreak: number;
  streakFreezeAvailable: number; // Max 2
  rollingPageAverage: number; // Default 10
  baselineGoal: number; // e.g., 15 pages/day
  currentGoal: number; // Adjusts dynamically
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

const INITIAL_BOOKS: Book[] = [
  {
    bookId: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 200,
    pagesRead: 90,
    status: 'reading',
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
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
  }
];

const INITIAL_USER: UserProfile = {
  uid: 'user-1',
  displayName: 'Rishabh',
  email: 'yom@example.com',
  createdAt: new Date().toISOString(),
  currentStreak: 5,
  streakFreezeAvailable: 2,
  rollingPageAverage: 10,
  baselineGoal: 15,
  currentGoal: 15,
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

function buildBookReadLogFromLogs(logs: ProgressLog[]): Record<string, Record<string, number>> {
  return logs.reduce<Record<string, Record<string, number>>>((acc, log) => {
    const bookLog = acc[log.bookId] || {};
    bookLog[log.dateString] = (bookLog[log.dateString] || 0) + log.pagesReadDelta;
    acc[log.bookId] = bookLog;
    return acc;
  }, {});
}

const INITIAL_READING_MARKERS: Record<string, number[]> = {
  'book-1': [45, 67, 90],
  'book-2': [45],
  'book-3': [80, 120],
  'book-4': [150, 250, 310],
};

function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const ReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [bookReadLog, setBookReadLog] = useState<Record<string, Record<string, number>>>(
    () => buildBookReadLogFromLogs(INITIAL_LOGS),
  );
  const [readingMarkers, setReadingMarkers] = useState<Record<string, number[]>>(INITIAL_READING_MARKERS);
  const [logs, setLogs] = useState<ProgressLog[]>(INITIAL_LOGS);
  const [streakWasProtectedYesterday, setStreakWasProtectedYesterday] = useState<boolean>(false);
  const [showFirstBookCelebration, setShowFirstBookCelebration] = useState<boolean>(false);
  const [vocabNotebook, setVocabNotebook] = useState<DefinitionResult[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>('book-1');

  const saveWord = (word: DefinitionResult) => {
    if (!isWordSaved(word.word)) {
      const activeBook = currentBook;
      const enhancedWord = {
        ...word,
        bookId: activeBook?.bookId,
        bookTitle: activeBook?.title,
        pageLearned: activeBook?.pagesRead,
        dateLearned: new Date().toISOString(),
      };
      setVocabNotebook(prev => [...prev, enhancedWord]);
    }
  };

  const toggleBookmark = (bookId: string) => {
    setBooks(prev =>
      prev.map(b =>
        b.bookId === bookId ? { ...b, isBookmarked: !b.isBookmarked } : b,
      ),
    );
  };

  const isWordSaved = (word: string): boolean => {
    return vocabNotebook.some(item => item.word.toLowerCase() === word.toLowerCase());
  };

  const removeWord = (word: string) => {
    setVocabNotebook(prev => prev.filter(item => item.word.toLowerCase() !== word.toLowerCase()));
  };

  const setCurrentBook = (bookId: string) => {
    const target = books.find(b => b.bookId === bookId);
    if (target) {
      setCurrentBookId(bookId);
      if (target.status !== 'reading') {
        setBooks(prev => prev.map(b => b.bookId === bookId ? { ...b, status: 'reading' as const } : b));
      }
    }
  };

  const updateGoal = (goal: number) => {
    setUser(prev => ({
      ...prev,
      baselineGoal: goal,
      currentGoal: goal,
    }));
  };

  // Active book is the one currently being read (matches currentBookId state, or falls back to first reading book)
  const currentBook = books.find(b => b.bookId === currentBookId && b.status === 'reading') 
    || books.find(b => b.status === 'reading') 
    || books[0] 
    || null;


  // Helper to check if user completed their first ever book
  const checkFirstBookCompletion = (updatedBooks: Book[]) => {
    // A book is completed if pagesRead === totalPages
    const completedCount = updatedBooks.filter(b => b.status === 'completed').length;
    if (completedCount === 1) {
      setShowFirstBookCelebration(true);
    }
  };

  // Helper to calculate rolling daily average speed (over active reading days in the last 5 days)
  const calculateRollingAverage = (currentLogs: ProgressLog[]): number => {
    const last5Days = Array.from({ length: 5 }, (_, i) => getRelativeDateString(-i));
    const recentLogs = currentLogs.filter(log => last5Days.includes(log.dateString));
    
    if (recentLogs.length === 0) return 10; // Default to 10 if no logs in last 5 days

    const totalPagesRead = recentLogs.reduce((sum, log) => sum + log.pagesReadDelta, 0);
    // Count unique days read in the last 5 days to avoid dividing by 0
    const uniqueDaysRead = new Set(recentLogs.map(log => log.dateString)).size;

    const average = uniqueDaysRead > 0 ? totalPagesRead / uniqueDaysRead : 10;
    return Math.max(1, Math.round(average * 10) / 10); // Round to 1 decimal place, minimum 1 page
  };

  // Helper to calculate estimated completion date
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

  // Core function: Update Reading Progress
  const updateProgress = (bookId: string, newPage: number) => {
    const book = books.find(b => b.bookId === bookId);
    if (!book) return;

    const previousPage = book.pagesRead;
    const delta = newPage - previousPage;
    if (delta <= 0) return; // Only allow positive updates

    // Log pages read for this specific book (per‑book heatmap)
    const todayStr = getRelativeDateString(0);
    setBookReadLog(prev => {
      const bookLog = prev[bookId] || {};
      const existing = bookLog[todayStr] || 0;
      return {
        ...prev,
        [bookId]: { ...bookLog, [todayStr]: existing + delta },
      };
    });

    setReadingMarkers(prev => {
      const existing = prev[bookId] || [];
      const page = Math.min(newPage, book.totalPages);
      if (existing.includes(page)) return prev;
      return { ...prev, [bookId]: [...existing, page].sort((a, b) => a - b) };
    });

    // 1. Update book pages read and check status
    const updatedBooks = books.map(b => {
      if (b.bookId === bookId) {
        const isFinished = newPage >= b.totalPages;
        return {
          ...b,
          pagesRead: Math.min(newPage, b.totalPages),
          status: isFinished ? ('completed' as const) : b.status,
          completedAt: isFinished ? new Date().toISOString() : undefined,
        };
      }
      return b;
    });

    setBooks(updatedBooks);

    // Check if first-ever book completed
    const wasBookCompletedNow = newPage >= book.totalPages && previousPage < book.totalPages;
    if (wasBookCompletedNow) {
      checkFirstBookCompletion(updatedBooks);
    }

    // 2. Add or update daily log entry
    let updatedLogs = [...logs];
    const existingLogIdx = logs.findIndex(l => l.bookId === bookId && l.dateString === todayStr);

    if (existingLogIdx > -1) {
      // Accumulate progress if multiple entries in the same day
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

    // 3. Recalculate rolling average
    const newRollingAvg = calculateRollingAverage(updatedLogs);

    // 4. Smart Goal System Logic
    // Collect the total pages read per entry for the last 3 logs
    // Sort logs by date descending to find the last 3 entries
    const uniqueLogsByDate = updatedLogs.reduce((acc: { [key: string]: number }, cur) => {
      acc[cur.dateString] = (acc[cur.dateString] || 0) + cur.pagesReadDelta;
      return acc;
    }, {});

    const sortedDates = Object.keys(uniqueLogsByDate).sort((a, b) => b.localeCompare(a));
    const last3DaysLogs = sortedDates.slice(0, 3).map(date => uniqueLogsByDate[date]);

    let newCurrentGoal = user.baselineGoal;

    // Check if we have at least 3 entries and all of them are below baseline
    if (last3DaysLogs.length >= 3 && last3DaysLogs.every(val => val < user.baselineGoal)) {
      const averageRead = last3DaysLogs.reduce((s, v) => s + v, 0) / 3;
      const deviation = user.baselineGoal - averageRead;
      // Goal = Baseline - Deviation * 0.2
      const calculatedGoal = user.baselineGoal - deviation * 0.2;
      newCurrentGoal = Math.max(1, Math.round(calculatedGoal)); // Ensure at least 1 page
      console.log(`Smart Goal Engine: User logged below baseline 3 times. Adjusting goal from ${user.baselineGoal} to ${newCurrentGoal}. (Average: ${averageRead.toFixed(1)}, Deviation: ${deviation.toFixed(1)})`);
    } else {
      // If user logs at or above baseline goal, restore it
      const loggedToday = uniqueLogsByDate[todayStr] || 0;
      if (loggedToday >= user.baselineGoal) {
        newCurrentGoal = user.baselineGoal;
      } else {
        // Keep current goal if they are under but haven't triggered 3 consecutive drops
        newCurrentGoal = user.currentGoal;
      }
    }

    // 5. Update user profile state
    setUser(prev => {
      // If they read today, ensure their streak is active/incremented
      // Streak logic: if they read today and did not read yesterday or streak is 0, set/increase streak.
      // (This is simple logic; simulation controls will test advanced streak protection)
      let nextStreak = prev.currentStreak;
      const yesterdayStr = getRelativeDateString(-1);
      const readYesterday = Object.keys(uniqueLogsByDate).includes(yesterdayStr);
      
      // If today is a new reading day and streak was 0, or they read yesterday, maintain/increment streak
      const readToday = uniqueLogsByDate[todayStr] > 0;
      if (readToday && nextStreak === 0) {
        nextStreak = 1;
      }

      return {
        ...prev,
        rollingPageAverage: newRollingAvg,
        currentGoal: newCurrentGoal,
        currentStreak: nextStreak,
      };
    });
  };

  const addBook = (title: string, author: string, totalPages: number, coverUrl?: string) => {
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
    };
    setBooks(prev => [newBook, ...prev]);
    setCurrentBookId(id);
  };

  const dismissCelebration = () => {
    setShowFirstBookCelebration(false);
  };

  const dismissProtectionBanner = () => {
    setStreakWasProtectedYesterday(false);
  };

  // --- SIMULATION HANDLERS ---

  // Simulation 1: Skip Day
  // Simulate that the user didn't read yesterday (logs for yesterday are empty)
  // If streakFreezeAvailable > 0, decrement freeze token by 1, keep streak, show banner.
  const simulateSkipDay = () => {
    if (user.streakFreezeAvailable > 0) {
      setUser(prev => ({
        ...prev,
        streakFreezeAvailable: prev.streakFreezeAvailable - 1,
        // Streak is preserved!
      }));
      setStreakWasProtectedYesterday(true);
    } else {
      setUser(prev => ({
        ...prev,
        currentStreak: 0, // Reset streak since no freeze available
      }));
      setStreakWasProtectedYesterday(false);
    }
  };

  // Simulation 2: Log 3 low entries
  // Create 3 entries with pages below baseline goal (e.g. baseline is 15, we write 2, 3, 1 pages)
  const simulateThreeLowEntries = () => {
    const tempLogs = [...logs];
    // Remove recent logs to avoid interference and push 3 low entries for consecutive simulated dates
    const dayMinus2 = getRelativeDateString(-2);
    const dayMinus1 = getRelativeDateString(-1);
    const dayToday = getRelativeDateString(0);

    // Filter out these days first
    let filteredLogs = tempLogs.filter(
      l => l.dateString !== dayMinus2 && l.dateString !== dayMinus1 && l.dateString !== dayToday
    );

    // Add low progress logs (baseline is 15, we log 3, 2, 4)
    filteredLogs.push({ id: 'sim-log-1', bookId: 'book-1', dateString: dayMinus2, pagesReadDelta: 3 });
    filteredLogs.push({ id: 'sim-log-2', bookId: 'book-1', dateString: dayMinus1, pagesReadDelta: 2 });
    filteredLogs.push({ id: 'sim-log-3', bookId: 'book-1', dateString: dayToday, pagesReadDelta: 4 });

    setLogs(filteredLogs);

    // Calculate new current goal
    // deviation = 15 - (3+2+4)/3 = 15 - 3 = 12
    // new goal = 15 - 12 * 0.2 = 15 - 2.4 = 12.6 -> round to 13
    const averageRead = (3 + 2 + 4) / 3;
    const deviation = user.baselineGoal - averageRead;
    const calculatedGoal = user.baselineGoal - deviation * 0.2;
    const adjustedGoal = Math.max(1, Math.round(calculatedGoal));

    // Calculate new rolling average for these low logs
    const newRollingAvg = calculateRollingAverage(filteredLogs);

    // Update book status so progress card matches: let's set current book page read to 90 + 3 + 2 + 4 = 99
    setBooks(prev =>
      prev.map(b => (b.bookId === 'book-1' ? { ...b, pagesRead: 99, status: 'reading' as const } : b))
    );

    setUser(prev => ({
      ...prev,
      rollingPageAverage: newRollingAvg,
      currentGoal: adjustedGoal,
    }));
  };

  // Reset simulation to original values
  const resetSimulation = () => {
    setUser(INITIAL_USER);
    setBooks(INITIAL_BOOKS);
    setLogs(INITIAL_LOGS);
    setBookReadLog(buildBookReadLogFromLogs(INITIAL_LOGS));
    setReadingMarkers(INITIAL_READING_MARKERS);
    setStreakWasProtectedYesterday(false);
    setShowFirstBookCelebration(false);

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
