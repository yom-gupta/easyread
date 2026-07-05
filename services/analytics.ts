// Analytics wrapper. Uses Firebase JS SDK analytics when available and falls
// back to a silent no-op everywhere else.

type EventParams = Record<string, string | number | boolean | null | undefined>;

let webAnalytics: any = null;
let ready = false;

const init = async () => {
  if (ready) return;
  ready = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAnalytics, isSupported } = require('firebase/analytics');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFirebaseApp } = require('../config/firebase');
    if (await isSupported()) {
      const app = getFirebaseApp();
      if (app) webAnalytics = getAnalytics(app);
    }
  } catch {
    // silent
  }
};

// Kick off init immediately at module load. Callers don't need to await.
init();

const safe = (fn: () => void) => { try { fn(); } catch { /* silent */ } };

export const analytics = {
  logEvent(name: string, params?: EventParams): void {
    if (webAnalytics) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logEvent } = require('firebase/analytics');
      safe(() => logEvent(webAnalytics, name, params));
    }
  },
  setUserId(uid: string | null): void {
    if (webAnalytics) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { setUserId } = require('firebase/analytics');
      safe(() => setUserId(webAnalytics, uid));
    }
  },
  setUserProperty(key: string, value: string | null): void {
    if (webAnalytics) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { setUserProperties } = require('firebase/analytics');
      safe(() => setUserProperties(webAnalytics, { [key]: value }));
    }
  },
  screen(name: string): void {
    this.logEvent('screen_view', { screen_name: name });
  },
};

// Canonical event names for the app. Using a shared constant avoids typos
// that would silently split the same event into two dashboard rows.
export const EVENTS = {
  onboarding_complete:  'onboarding_complete',
  onboarding_skip:      'onboarding_skip',
  auth_signup:          'auth_signup',
  auth_login:           'auth_login',
  auth_signout:         'auth_signout',
  book_added:           'book_added',
  book_completed:       'book_completed',
  pages_logged:         'pages_logged',
  streak_extended:      'streak_extended',
  streak_broken:        'streak_broken',
  word_searched:        'word_searched',
  word_saved:           'word_saved',
  word_removed:         'word_removed',
  wotd_saved:           'wotd_saved',
  wotd_dismissed:       'wotd_dismissed',
  notifications_enable: 'notifications_enable',
  notifications_tone:   'notifications_tone',
  grammar_sheet_open:   'grammar_sheet_open',
  share_word:           'share_word',
} as const;
