// ──────────────────────────────────────────────────────────────
//  EasyReads Achievements System
// ──────────────────────────────────────────────────────────────

export type AchievementCategory =
  | 'Reading'
  | 'Streak'
  | 'Vocab'
  | 'Lifestyle'
  | 'XP'
  | 'Goals'
  | 'Social'
  | 'PerBook';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  xpReward: number;
  category: AchievementCategory;
  isPerBook?: boolean;  // true = repeatable per book, id includes ${bookId}_
}

// ── GLOBAL ACHIEVEMENTS ────────────────────────────────────────
export const GLOBAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'pehla_qadam',
    emoji: '📖',
    name: 'Pehla Qadam',
    description: 'Finish your very first book ever',
    xpReward: 100,
    category: 'Reading',
  },
  {
    id: '7_day_lafanga',
    emoji: '🔥',
    name: '7-Day Lafanga',
    description: 'Read for 7 consecutive days',
    xpReward: 50,
    category: 'Streak',
  },
  {
    id: '14_day_dhamaka',
    emoji: '💥',
    name: '14-Day Dhamaka',
    description: 'Read for 14 consecutive days',
    xpReward: 75,
    category: 'Streak',
  },
  {
    id: 'ek_mahina',
    emoji: '📅',
    name: 'Ek Mahina!',
    description: 'Read for 30 consecutive days — legend mode!',
    xpReward: 150,
    category: 'Streak',
  },
  {
    id: 'shabd_collector',
    emoji: '💬',
    name: 'Shabd Collector',
    description: 'Add 50 words to the Vocab Vault',
    xpReward: 25,
    category: 'Vocab',
  },
  {
    id: 'word_boss',
    emoji: '🧠',
    name: 'Word Boss',
    description: 'Master 25 words (pass quiz 3× each)',
    xpReward: 50,
    category: 'Vocab',
  },
  {
    id: 'vocabulary_veteran',
    emoji: '📖',
    name: 'Vocabulary Veteran',
    description: 'Master 100 words total',
    xpReward: 100,
    category: 'Vocab',
  },
  {
    id: 'raat_ka_padhaku',
    emoji: '🌙',
    name: 'Raat Ka Padhaku',
    description: 'Log a reading session after 10:00 PM',
    xpReward: 10,
    category: 'Lifestyle',
  },
  {
    id: 'subah_ka_warrior',
    emoji: '🌅',
    name: 'Subah Ka Warrior',
    description: 'Log a reading session before 7:00 AM',
    xpReward: 10,
    category: 'Lifestyle',
  },
  {
    id: 'speed_reader',
    emoji: '⚡',
    name: 'Speed Reader',
    description: 'Log 100+ pages in a single calendar week',
    xpReward: 50,
    category: 'Reading',
  },
  {
    id: 'century',
    emoji: '💯',
    name: 'Century!',
    description: 'Log 100+ pages in a single calendar day',
    xpReward: 100,
    category: 'Reading',
  },
  {
    id: 'book_worm',
    emoji: '🐛',
    name: 'Book Worm',
    description: 'Finish any 5 books',
    xpReward: 100,
    category: 'Reading',
  },
  {
    id: 'ek_aur_ek_gyarah',
    emoji: '📚',
    name: 'Ek Aur Ek Gyarah',
    description: 'Finish any 11 books',
    xpReward: 150,
    category: 'Reading',
  },
  {
    id: 'milestone_1k',
    emoji: '🌟',
    name: 'Milestone: 1K XP',
    description: 'Accumulate 1,000 total XP',
    xpReward: 50,
    category: 'XP',
  },
  {
    id: 'milestone_5k',
    emoji: '🌟',
    name: 'Milestone: 5K XP',
    description: 'Accumulate 5,000 total XP',
    xpReward: 100,
    category: 'XP',
  },
  {
    id: 'comeback_king',
    emoji: '👑',
    name: 'Comeback King',
    description: 'Log reading again after a 7+ day gap (no freeze used)',
    xpReward: 20,
    category: 'Streak',
  },
  {
    id: 'streak_saver',
    emoji: '🛡️',
    name: 'Streak Saver',
    description: 'Successfully use a Streak Freeze Token',
    xpReward: 5,
    category: 'Streak',
  },
  {
    id: 'card_sharer',
    emoji: '📤',
    name: 'Card Sharer',
    description: 'Share 10 Vocab Cards to Instagram Stories',
    xpReward: 25,
    category: 'Social',
  },
  {
    id: 'goal_crusher',
    emoji: '🎯',
    name: 'Goal Crusher',
    description: 'Hit daily page goal 7 days in a row',
    xpReward: 60,
    category: 'Goals',
  },
];

// ── PER-BOOK ACHIEVEMENT TEMPLATES ────────────────────────────
export interface PerBookAchievementTemplate {
  suffix: string;
  emoji: string;
  name: string;
  description: string;
  xpReward: number;
}

export const PER_BOOK_TEMPLATES: PerBookAchievementTemplate[] = [
  {
    suffix: 'shuru',
    emoji: '🚀',
    name: 'Shuru Ho Gaya!',
    description: 'Open a new book and log reading for the first time',
    xpReward: 5,
  },
  {
    suffix: 'aadha',
    emoji: '🎯',
    name: 'Aadha Ho Gaya',
    description: 'Reach 50% of total pages in this book',
    xpReward: 20,
  },
  {
    suffix: 'speed_demon',
    emoji: '⚡',
    name: 'Speed Demon',
    description: 'Finish the entire book in under 7 calendar days',
    xpReward: 75,
  },
  {
    suffix: 'word_rich',
    emoji: '💬',
    name: 'Word Rich',
    description: 'Collect 20+ words from this single book',
    xpReward: 30,
  },
  {
    suffix: '7day_reader',
    emoji: '📅',
    name: '7-Day Book Reader',
    description: 'Log reading for this book on 7 different days',
    xpReward: 25,
  },
  {
    suffix: 'marathon',
    emoji: '🏃',
    name: 'Marathon Runner',
    description: 'Read 300+ total pages in this book',
    xpReward: 50,
  },
  {
    suffix: 'pehla_kitaab',
    emoji: '🥇',
    name: 'Pehla Kitaab!',
    description: 'Complete your very first book — a legendary milestone!',
    xpReward: 200,
  },
  {
    suffix: 'khatam_kiya',
    emoji: '🏁',
    name: 'Khatam Kiya!',
    description: 'Complete a book — great work, keep going!',
    xpReward: 100,
  },
];

/** Build a per-book achievement ID */
export function perBookId(bookId: string, suffix: string): string {
  return `${bookId}__${suffix}`;
}

/** Reverse: get template suffix from a per-book achievement ID */
export function getPerBookSuffix(achievementId: string): string | null {
  const parts = achievementId.split('__');
  return parts.length === 2 ? parts[1] : null;
}

/** Get template from suffix */
export function getPerBookTemplate(suffix: string): PerBookAchievementTemplate | undefined {
  return PER_BOOK_TEMPLATES.find(t => t.suffix === suffix);
}

/** Get full Achievement object for any id (global or per-book) */
export function getAchievementById(id: string): Achievement | null {
  // Check global
  const global = GLOBAL_ACHIEVEMENTS.find(a => a.id === id);
  if (global) return global;

  // Check per-book
  const suffix = getPerBookSuffix(id);
  if (suffix) {
    const template = getPerBookTemplate(suffix);
    if (template) {
      return {
        id,
        emoji: template.emoji,
        name: template.name,
        description: template.description,
        xpReward: template.xpReward,
        category: 'PerBook',
        isPerBook: true,
      };
    }
  }
  return null;
}

// ── CHECK ACHIEVEMENTS ─────────────────────────────────────────

export interface AchievementCheckState {
  totalXP: number;
  currentStreak: number;
  totalBooksFinished: number;
  totalPagesRead: number;
  achievements: string[];                        // already earned IDs
  vocabCount: number;                            // total words in vault
  masteredWordCount: number;
  weeklyPages: number;                           // pages in last 7 days
  dailyPages: number;                            // pages today
  consecutiveGoalDays: number;                   // days in a row hitting goal
  vocabSharedCount: number;                      // total shares
  streakFreezeUsedToday: boolean;
  daysSinceLastRead: number;                     // days gap before today's log
  logHour: number;                               // hour of the log (0–23)
  // Per-book specific
  activeBookId: string | null;
  activeBookPagesRead: number;
  activeBookTotalPages: number;
  activeBookDaysLogged: number;
  activeBookVocabCount: number;
  activeBookStartedAt: string;
  isFirstEverBook: boolean;
  isBookJustCompleted: boolean;
}

export function checkAchievements(state: AchievementCheckState): string[] {
  const earned = state.achievements;
  const newlyEarned: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !earned.includes(id) && !newlyEarned.includes(id)) {
      newlyEarned.push(id);
    }
  };

  // ── Global ────────────────────────────────────────────────────
  check('pehla_qadam',       state.totalBooksFinished >= 1);
  check('7_day_lafanga',     state.currentStreak >= 7);
  check('14_day_dhamaka',    state.currentStreak >= 14);
  check('ek_mahina',         state.currentStreak >= 30);
  check('shabd_collector',   state.vocabCount >= 50);
  check('word_boss',         state.masteredWordCount >= 25);
  check('vocabulary_veteran',state.masteredWordCount >= 100);
  check('raat_ka_padhaku',   state.logHour >= 22);
  check('subah_ka_warrior',  state.logHour < 7);
  check('speed_reader',      state.weeklyPages >= 100);
  check('century',           state.dailyPages >= 100);
  check('book_worm',         state.totalBooksFinished >= 5);
  check('ek_aur_ek_gyarah',  state.totalBooksFinished >= 11);
  check('milestone_1k',      state.totalXP >= 1000);
  check('milestone_5k',      state.totalXP >= 5000);
  check('streak_saver',      state.streakFreezeUsedToday);
  check('goal_crusher',      state.consecutiveGoalDays >= 7);
  check('comeback_king',     state.daysSinceLastRead >= 7 && !state.streakFreezeUsedToday);

  // ── Per-book ──────────────────────────────────────────────────
  if (state.activeBookId) {
    const bid = state.activeBookId;
    const pct = state.activeBookTotalPages > 0
      ? state.activeBookPagesRead / state.activeBookTotalPages
      : 0;

    // Days since book was started
    const bookStartedDate = new Date(state.activeBookStartedAt);
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - bookStartedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    check(perBookId(bid, 'shuru'),       state.activeBookDaysLogged >= 1);
    check(perBookId(bid, 'aadha'),       pct >= 0.5);
    check(perBookId(bid, 'speed_demon'), state.isBookJustCompleted && daysSinceStart <= 7);
    check(perBookId(bid, 'word_rich'),   state.activeBookVocabCount >= 20);
    check(perBookId(bid, '7day_reader'), state.activeBookDaysLogged >= 7);
    check(perBookId(bid, 'marathon'),    state.activeBookPagesRead >= 300 && state.activeBookTotalPages >= 300);

    if (state.isBookJustCompleted) {
      if (state.isFirstEverBook) {
        check(perBookId(bid, 'pehla_kitaab'), true);
      } else {
        check(perBookId(bid, 'khatam_kiya'), true);
      }
    }
  }

  return newlyEarned;
}
