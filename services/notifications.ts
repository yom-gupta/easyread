// Reading reminders. Zomato-flavoured copy — short, timely, a little cheeky,
// with the app's own personality (books, streaks, cliffhangers).
//
// Falls back to no-ops if expo-notifications isn't installed yet so the
// app never crashes on a fresh dev boot.

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'reading_reminders_v1';
const REMINDER_TAG = 'easyreads:daily-reminder';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  tone: ReminderTone;
}

export type ReminderTone = 'gentle' | 'cheeky' | 'competitive';

export const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 30,
  tone: 'cheeky',
};

// ── Copy library ─────────────────────────────────────────────
// Rotated per firing so the reminder never feels robotic.

interface CopyLine {
  title: string;
  body: string;
}

const COPY: Record<ReminderTone, CopyLine[]> = {
  gentle: [
    { title: 'A little reading?', body: 'Ten minutes and a cup of chai — that\'s all it takes today.' },
    { title: 'Your bookmark is waiting', body: 'Right where you left it. No rush.' },
    { title: 'One page, one deep breath', body: 'Reading is a soft place to land. Come back for a bit.' },
    { title: 'A quiet moment for you', body: 'Slip into your book — even just a page counts.' },
  ],
  cheeky: [
    { title: 'Your book is subtweeting you 📚', body: '"Left on read, again." — the book' },
    { title: 'Yesterday\'s cliffhanger says hi 👋', body: 'It\'s been sitting there. Alone. Wondering.' },
    { title: 'Plot twist: it\'s reading time', body: 'Ten minutes now, or an unread pile of shame later. You choose.' },
    { title: 'Your streak is watching 👀', body: 'One little page and it\'ll stop staring. Promise.' },
    { title: 'Book o\'clock', body: 'Doomscroll later. Chapter now.' },
    { title: 'Ping! From your bookshelf', body: 'The shelf has feelings and today those feelings are neglected.' },
  ],
  competitive: [
    { title: 'Don\'t break the streak', body: 'You\'ve come this far. Ten pages saves it. Go.' },
    { title: 'Streak alert 🔥', body: 'Log even one page tonight to keep the flame alive.' },
    { title: 'Your goal is 90% there', body: 'A short push, and today is done. Show up.' },
    { title: 'You vs. yesterday-you', body: 'Yesterday-you read. Today-you can too. Prove it.' },
  ],
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const nextCopy = (tone: ReminderTone): CopyLine => pick(COPY[tone] ?? COPY.cheeky);

// ── Storage ──────────────────────────────────────────────────

export async function loadSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* silent */ }
}

// ── Permissions ──────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

// ── Scheduling ───────────────────────────────────────────────

export async function cancelAll(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* silent */ }
}

export async function scheduleDaily(settings: ReminderSettings): Promise<boolean> {
  if (!Notifications) return false;

  await cancelAll();
  if (!settings.enabled) return true;

  const granted = await requestPermission();
  if (!granted) return false;

  const line = nextCopy(settings.tone);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_TAG,
      content: {
        title: line.title,
        body: line.body,
        sound: 'default',
        data: { kind: 'daily-reminder', tone: settings.tone },
      },
      trigger: {
        hour: settings.hour,
        minute: settings.minute,
        repeats: true,
      },
    });
    return true;
  } catch {
    return false;
  }
}

// One-off "book logged" celebration nudge — fires ~2s later so it lands
// as the user closes the log sheet. `bookmarkedAtPage` is the new page
// number the user just logged (not a delta).
export async function celebrateBookLogged(bookTitle: string, bookmarkedAtPage: number): Promise<void> {
  if (!Notifications) return;
  try {
    const lines = [
      { title: 'Logged. Streak lives on 🔥', body: `Bookmark set at page ${bookmarkedAtPage} of ${bookTitle}.` },
      { title: 'Beautiful hustle 📚', body: `Page ${bookmarkedAtPage} of ${bookTitle} — proud of you.` },
      { title: 'That\'s the way', body: `Saved at page ${bookmarkedAtPage}. Tomorrow-you says thanks.` },
    ];
    const pickLine = pick(lines);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: pickLine.title,
        body: pickLine.body,
        sound: 'default',
      },
      trigger: { seconds: 2 },
    });
  } catch { /* silent */ }
}

// Preview: show the exact copy the user will get without touching schedule.
export function previewCopy(tone: ReminderTone): CopyLine {
  return nextCopy(tone);
}

// ── Streak guard ─────────────────────────────────────────────
// Reminder that fires at 8pm local IF the user's active streak is at risk
// (they haven't logged today). Cancels itself the moment they log.

const STREAK_GUARD_TAG = 'easyreads:streak-guard';
const STREAK_GUARD_HOUR = 20;
const STREAK_GUARD_MINUTE = 0;

const streakGuardCopy = (streak: number): CopyLine => {
  const lines: CopyLine[] = [
    { title: `${streak}-day streak in danger 🔥`, body: 'You haven\'t logged today. Even one page saves it.' },
    { title: 'Your streak is holding its breath', body: `${streak} days. Don\'t let today be the one that broke it.` },
    { title: 'Emergency page-read alert 🚨', body: `${streak} days of showing up. Are we doing this or not?` },
    { title: 'A tiny push saves it', body: `${streak}-day streak · log any page tonight to keep the flame alive.` },
  ];
  return pick(lines);
};

export interface StreakGuardInput {
  currentStreak: number;
  hasLoggedToday: boolean;
}

// Call this on app foreground, after updateProgress, and whenever streak
// state changes. Idempotent — always cancels the previous guard first.
export async function scheduleStreakGuard({ currentStreak, hasLoggedToday }: StreakGuardInput): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_GUARD_TAG);
  } catch { /* silent — nothing to cancel */ }

  // Nothing to guard if no streak or already logged.
  if (currentStreak < 1 || hasLoggedToday) return;

  // Only schedule if we're still before the guard hour today.
  const now = new Date();
  const guardTime = new Date();
  guardTime.setHours(STREAK_GUARD_HOUR, STREAK_GUARD_MINUTE, 0, 0);
  if (guardTime.getTime() <= now.getTime()) return;

  const granted = await requestPermission();
  if (!granted) return;

  const line = streakGuardCopy(currentStreak);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_GUARD_TAG,
      content: {
        title: line.title,
        body: line.body,
        sound: 'default',
        data: { kind: 'streak-guard', streak: currentStreak },
      },
      trigger: {
        hour: STREAK_GUARD_HOUR,
        minute: STREAK_GUARD_MINUTE,
        repeats: false,
      },
    });
  } catch { /* silent */ }
}
