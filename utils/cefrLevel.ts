// Approximate CEFR level from Google frequency (per-million tokens).
// This is a HEURISTIC, not a real CEFR list — a proper A1–C2 dataset (e.g.
// English Vocabulary Profile) would be ~50KB and give a truer read.
// Buckets tuned so common function/content words land in A1–A2 and rare
// literary words in C1–C2.
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const cefrFromFrequency = (freq: number): CefrLevel => {
  if (freq >= 100) return 'A1';
  if (freq >= 20)  return 'A2';
  if (freq >= 5)   return 'B1';
  if (freq >= 1)   return 'B2';
  if (freq >= 0.1) return 'C1';
  return 'C2';
};

export const CEFR_HINT: Record<CefrLevel, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
};
