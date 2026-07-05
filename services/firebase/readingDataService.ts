import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../config/firebase';
import type {
  Book,
  DefinitionResult,
  BookNote,
  ProgressLog,
  UserProfile,
} from '../../context/ReadingContext';

const BATCH_LIMIT = 500;

function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && !Array.isArray(value) && value !== null
        ? stripUndefined(value)
        : value;
    }
  }
  return cleaned as T;
}

export interface ReadingData {
  user: UserProfile;
  books: Book[];
  logs: ProgressLog[];
  vocabNotebook: DefinitionResult[];
  notes: BookNote[];
  readingMarkers: Record<string, number[]>;
  currentBookId: string;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function createDefaultUserProfile(uid: string): UserProfile {
  return {
    uid,
    displayName: 'Reader',
    email: '',
    createdAt: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: getTodayString(),
    streakFreezeAvailable: 2,
    streakFreezeUsedToday: false,
    rollingPageAverage: 10,
    baselineGoal: 15,
    currentGoal: 15,
    totalXP: 0,
    level: 1,
    achievements: [],
    totalPagesRead: 0,
    totalBooksFinished: 0,
    vocabSharedCount: 0,
    consecutiveGoalDays: 0,
  };
}

function vocabDocId(word: string): string {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function noteDocId(noteId: string): string {
  return noteId;
}

export async function loadReadingData(uid: string): Promise<ReadingData | null> {
  const db = getFirebaseDb();
  if (!db) {
    return null;
  }

  const [userSnap, booksSnap, logsSnap, vocabSnap, notesSnap, metaSnap] =
    await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDocs(collection(db, 'users', uid, 'books')),
      getDocs(collection(db, 'users', uid, 'logs')),
      getDocs(collection(db, 'users', uid, 'vocab')),
      getDocs(collection(db, 'users', uid, 'notes')),
      getDoc(doc(db, 'users', uid, 'meta', 'app')),
    ]);

  const hasData =
    userSnap.exists() ||
    !booksSnap.empty ||
    !logsSnap.empty ||
    !vocabSnap.empty ||
    !notesSnap.empty;

  if (!hasData) {
    return null;
  }

  const user = userSnap.exists()
    ? ({ uid, ...userSnap.data() } as UserProfile)
    : createDefaultUserProfile(uid);

  const books = booksSnap.docs.map(d => d.data() as Book);
  const logs = logsSnap.docs.map(d => d.data() as ProgressLog);
  const vocabNotebook = vocabSnap.docs.map(d => d.data() as DefinitionResult);
  const notes = notesSnap.docs.map(d => d.data() as BookNote);
  const meta = metaSnap.exists()
    ? (metaSnap.data() as {
        currentBookId?: string;
        readingMarkers?: Record<string, number[]>;
      })
    : {};

  return {
    user,
    books,
    logs,
    vocabNotebook,
    notes,
    readingMarkers: meta.readingMarkers ?? {},
    currentBookId: meta.currentBookId ?? books[0]?.bookId ?? '',
  };
}

export async function saveReadingData(
  uid: string,
  data: ReadingData,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    return;
  }

  let existingBookIds = new Set<string>();
  let existingLogIds = new Set<string>();
  let existingVocabIds = new Set<string>();
  let existingNoteIds = new Set<string>();

  try {
    const [existingBooks, existingLogs, existingVocab, existingNotes] = await Promise.allSettled([
      getDocs(collection(db, 'users', uid, 'books')),
      getDocs(collection(db, 'users', uid, 'logs')),
      getDocs(collection(db, 'users', uid, 'vocab')),
      getDocs(collection(db, 'users', uid, 'notes')),
    ]);

    if (existingBooks.status === 'fulfilled') {
      existingBooks.value.docs.forEach(snap => existingBookIds.add(snap.id));
    }
    if (existingLogs.status === 'fulfilled') {
      existingLogs.value.docs.forEach(snap => existingLogIds.add(snap.id));
    }
    if (existingVocab.status === 'fulfilled') {
      existingVocab.value.docs.forEach(snap => existingVocabIds.add(snap.id));
    }
    if (existingNotes.status === 'fulfilled') {
      existingNotes.value.docs.forEach(snap => existingNoteIds.add(snap.id));
    }
  } catch {
    // failed to read existing docs — proceed with full overwrite
  }

  let batch = writeBatch(db);
  let opCount = 0;

  const commitBatch = async () => {
    await batch.commit();
    batch = writeBatch(db);
    opCount = 0;
  };

  const trackOp = async () => {
    opCount++;
    if (opCount >= BATCH_LIMIT) await commitBatch();
  };

  const { uid: _uid, ...userFields } = data.user;
  batch.set(doc(db, 'users', uid), stripUndefined(userFields), { merge: true });
  opCount++;

  const bookIds = new Set(data.books.map(b => b.bookId));
  for (const id of existingBookIds) {
    if (!bookIds.has(id)) {
      batch.delete(doc(db, 'users', uid, 'books', id));
      await trackOp();
    }
  }
  for (const book of data.books) {
    batch.set(doc(db, 'users', uid, 'books', book.bookId), stripUndefined(book));
    await trackOp();
  }

  const logIds = new Set(data.logs.map(l => l.id));
  for (const id of existingLogIds) {
    if (!logIds.has(id)) {
      batch.delete(doc(db, 'users', uid, 'logs', id));
      await trackOp();
    }
  }
  for (const log of data.logs) {
    batch.set(doc(db, 'users', uid, 'logs', log.id), stripUndefined(log));
    await trackOp();
  }

  const vocabIds = new Set(data.vocabNotebook.map(v => vocabDocId(v.word)));
  for (const id of existingVocabIds) {
    if (!vocabIds.has(id)) {
      batch.delete(doc(db, 'users', uid, 'vocab', id));
      await trackOp();
    }
  }
  for (const entry of data.vocabNotebook) {
    batch.set(
      doc(db, 'users', uid, 'vocab', vocabDocId(entry.word)),
      stripUndefined(entry),
    );
    await trackOp();
  }

  const noteIds = new Set(data.notes.map(n => noteDocId(n.id)));
  for (const id of existingNoteIds) {
    if (!noteIds.has(id)) {
      batch.delete(doc(db, 'users', uid, 'notes', id));
      await trackOp();
    }
  }
  for (const note of data.notes) {
    batch.set(
      doc(db, 'users', uid, 'notes', noteDocId(note.id)),
      stripUndefined(note),
    );
    await trackOp();
  }

  batch.set(doc(db, 'users', uid, 'meta', 'app'), stripUndefined({
    currentBookId: data.currentBookId,
    readingMarkers: data.readingMarkers,
  }));
  opCount++;

  await batch.commit();
}
