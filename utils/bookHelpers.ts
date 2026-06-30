import { Book, DefinitionResult, ProgressLog } from '../context/ReadingContext';

export type LibraryFilter = 'all' | 'reading' | 'completed' | 'new' | 'achievements';

export interface BookBadge {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export function getBookDailyPages(bookId: string, logs: ProgressLog[]): Record<string, number> {
  return logs
    .filter(l => l.bookId === bookId)
    .reduce<Record<string, number>>((acc, log) => {
      acc[log.dateString] = (acc[log.dateString] || 0) + log.pagesReadDelta;
      return acc;
    }, {});
}

export function getBookPageMarkers(
  bookId: string,
  readingMarkers: Record<string, number[]>,
  vocabNotebook: DefinitionResult[],
): number[] {
  const progressMarkers = readingMarkers[bookId] || [];
  const vocabPages = vocabNotebook
    .filter(v => v.bookId === bookId && v.pageLearned)
    .map(v => v.pageLearned as number);
  return [...new Set([...progressMarkers, ...vocabPages])].sort((a, b) => a - b);
}

export function getBookBadges(
  book: Book,
  logs: ProgressLog[],
  vocabNotebook: DefinitionResult[],
): BookBadge[] {
  const badges: BookBadge[] = [];
  const bookLogs = logs.filter(l => l.bookId === book.bookId);
  const daysRead = new Set(bookLogs.map(l => l.dateString)).size;
  const maxDayPages = Math.max(0, ...bookLogs.map(l => l.pagesReadDelta));
  const vocabCount = vocabNotebook.filter(v => v.bookId === book.bookId).length;
  const pct = book.totalPages > 0 ? (book.pagesRead / book.totalPages) * 100 : 0;

  if (book.status === 'completed') {
    badges.push({ id: 'finished', label: 'Finished', icon: 'checkmark-circle', color: '#4A7C59' });
  }
  if (pct >= 50 && book.status === 'reading') {
    badges.push({ id: 'halfway', label: 'Halfway', icon: 'flag', color: '#2563EB' });
  }
  if (daysRead >= 7) {
    badges.push({ id: 'dedicated', label: '7-Day Reader', icon: 'calendar', color: '#9333EA' });
  }
  if (maxDayPages >= 20) {
    badges.push({ id: 'speed', label: 'Speed Reader', icon: 'flash', color: '#F97316' });
  }
  if (vocabCount >= 5) {
    badges.push({ id: 'scholar', label: 'Word Collector', icon: 'school', color: '#C5A880' });
  }
  if (book.pagesRead >= 300) {
    badges.push({ id: 'marathon', label: 'Marathon', icon: 'trophy', color: '#DC2626' });
  }

  const daysSinceStart = (Date.now() - new Date(book.startedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceStart <= 7) {
    badges.push({ id: 'new', label: 'New Arrival', icon: 'sparkles', color: '#0EA5E9' });
  }

  return badges;
}

export function filterBooks(books: Book[], filter: LibraryFilter, logs: ProgressLog[], vocab: DefinitionResult[]): Book[] {
  switch (filter) {
    case 'reading':
      return books.filter(b => b.status === 'reading');
    case 'completed':
      return books.filter(b => b.status === 'completed');
    case 'new': {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return books.filter(b => new Date(b.startedAt).getTime() >= weekAgo);
    }
    case 'achievements':
      return books.filter(b => getBookBadges(b, logs, vocab).length > 0);
    default:
      return books;
  }
}

export const FILTER_OPTIONS: { id: LibraryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Books', icon: 'library' },
  { id: 'reading', label: 'Reading', icon: 'book' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { id: 'new', label: 'New', icon: 'sparkles' },
  { id: 'achievements', label: 'Badges', icon: 'ribbon' },
];
