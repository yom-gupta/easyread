// ──────────────────────────────────────────────────────────────
//  EasyReads XP & Level System
// ──────────────────────────────────────────────────────────────

export type XPAction =
  | 'page_read'         // per page
  | 'word_added'        // per word added to vault
  | 'quiz_pass'         // per quiz completed (pass)
  | 'word_mastered'     // per word status → mastered
  | 'daily_goal_hit'    // daily page goal achieved
  | 'book_completed'    // finishing a book
  | 'achievement'       // any achievement unlock
  | 'streak_7'          // 7-day streak milestone
  | 'streak_14'         // 14-day streak milestone
  | 'streak_30'         // 30-day streak milestone
  | 'vocab_shared';     // vocab card shared to social

export const XP_RATES: Record<XPAction, number> = {
  page_read: 2,
  word_added: 5,
  quiz_pass: 15,
  word_mastered: 50,
  daily_goal_hit: 20,
  book_completed: 100,
  achievement: 10,
  streak_7: 50,
  streak_14: 75,
  streak_30: 150,
  vocab_shared: 5,
};

export interface LevelInfo {
  level: number;
  name: string;           // English label
  hindiName: string;      // Hindi display
  emoji: string;
  minXP: number;
  maxXP: number;          // Infinity for last level
  roastLine: string;      // Shown on level-up screen
  color: string;          // Gradient accent color
}

export const LEVEL_TABLE: LevelInfo[] = [
  {
    level: 1,
    name: 'Bewakoof Bacche',
    hindiName: 'बेवकूफ बच्चे',
    emoji: '🍼',
    minXP: 0,
    maxXP: 99,
    roastLine: 'Bhai, abhi toh shuru kiya hai! Padhte reh! 📚',
    color: '#94A3B8',
  },
  {
    level: 2,
    name: 'Confused Chacha',
    hindiName: 'Confused चाचा',
    emoji: '😵',
    minXP: 100,
    maxXP: 299,
    roastLine: 'Confused Chacha se nikal! Thoda aur padhle bhai 🤯',
    color: '#60A5FA',
  },
  {
    level: 3,
    name: 'Thoda Padhaku',
    hindiName: 'थोड़ा पढ़ाकू',
    emoji: '📖',
    minXP: 300,
    maxXP: 599,
    roastLine: 'Thoda thoda, roz roz — aise hi bante hain heroes! 💪',
    color: '#34D399',
  },
  {
    level: 4,
    name: 'Shabd Ka Chor',
    hindiName: 'शब्द का चोर',
    emoji: '🕵️',
    minXP: 600,
    maxXP: 999,
    roastLine: 'Words churane mein expert ho gaye ho yaar! 🔍',
    color: '#A78BFA',
  },
  {
    level: 5,
    name: 'Gyaan Ka Bhookha',
    hindiName: 'ज्ञान का भूखा',
    emoji: '🍽️',
    minXP: 1000,
    maxXP: 1499,
    roastLine: 'Gyaan ki bhook lag gayi! Ab ruko mat, aage badho! 🚀',
    color: '#FB923C',
  },
  {
    level: 6,
    name: 'Dictionary Dost',
    hindiName: 'Dictionary दोस्त',
    emoji: '📚',
    minXP: 1500,
    maxXP: 2499,
    roastLine: 'Teri aur dictionary ki dosti pakki ho gayi, bhai! 🤝',
    color: '#F472B6',
  },
  {
    level: 7,
    name: 'Padhai Ka Patakha',
    hindiName: 'पढ़ाई का पटाखा',
    emoji: '🧨',
    minXP: 2500,
    maxXP: 3999,
    roastLine: 'PATAKHA! Tu toh reading mein bomb hai bhai! 💥',
    color: '#FBBF24',
  },
  {
    level: 8,
    name: 'Akalmand Insaan',
    hindiName: 'अक्लमंद इंसान',
    emoji: '🧠',
    minXP: 4000,
    maxXP: 5999,
    roastLine: 'Dimag ab full charge hai. Teri iqmat ke kya kehne! 🎯',
    color: '#2DD4BF',
  },
  {
    level: 9,
    name: 'Kitaab Ka Keeda',
    hindiName: 'किताब का कीड़ा',
    emoji: '🐛',
    minXP: 6000,
    maxXP: 9999,
    roastLine: 'Keeda level unlocked! Books tere liye khaana hai! 🐛📚',
    color: '#818CF8',
  },
  {
    level: 10,
    name: 'Maha Padhaku',
    hindiName: 'महा पढ़ाकू',
    emoji: '👑',
    minXP: 10000,
    maxXP: Infinity,
    roastLine: 'MAHA PADHAKU! Tera koi tod nahi. Legend. 👑🔥',
    color: '#F59E0B',
  },
];

export function getLevelFromXP(xp: number): LevelInfo {
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TABLE[i].minXP) return LEVEL_TABLE[i];
  }
  return LEVEL_TABLE[0];
}

export function getXPForAction(action: XPAction, quantity = 1): number {
  return XP_RATES[action] * quantity;
}

/** Returns 0–1 progress within the current level's XP range */
export function getLevelProgress(xp: number): number {
  const lvl = getLevelFromXP(xp);
  if (lvl.maxXP === Infinity) return 1;
  const range = lvl.maxXP - lvl.minXP + 1;
  const earned = xp - lvl.minXP;
  return Math.min(1, Math.max(0, earned / range));
}

/** XP needed to reach next level, or 0 if already max */
export function getXPToNextLevel(xp: number): number {
  const lvl = getLevelFromXP(xp);
  if (lvl.maxXP === Infinity) return 0;
  return lvl.maxXP + 1 - xp;
}
