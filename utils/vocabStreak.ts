// Weekly vocab saves — derives from the notebook, no new state needed.
// A "week" is rolling 7 days from now, not Mon-Sun, so it always feels current.

interface HasSavedAt {
  dateLearned?: string;
  savedAt?: string;
}

export function wordsSavedThisWeek<T extends HasSavedAt>(vocab: T[]): number {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const w of vocab) {
    const raw = w.dateLearned || w.savedAt;
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!isNaN(t) && t >= weekAgo && t <= now) count++;
  }
  return count;
}

// Copy for the mini badge next to the Save button. Ordinal-y so it feels
// personal without a big number tunnel.
export function vocabStreakBadge(countAfterSave: number): string | null {
  if (countAfterSave <= 0) return null;
  if (countAfterSave === 1) return '1st this week';
  const suffix = countAfterSave % 100 >= 11 && countAfterSave % 100 <= 13
    ? 'th'
    : ['th','st','nd','rd','th','th','th','th','th','th'][countAfterSave % 10];
  return `${countAfterSave}${suffix} this week`;
}
