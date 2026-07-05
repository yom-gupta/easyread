// Curated seed list — mixed-difficulty English words with real "aha" value.
// Chosen for teachability: concrete meaning, single dominant sense, memorable.
// Rotates by the local date so every user sees the same word on day X.
const SEEDS: string[] = [
  'ephemeral', 'sanctuary', 'sonder', 'petrichor', 'halcyon', 'quixotic',
  'ineffable', 'serendipity', 'saudade', 'ubiquitous', 'ethereal', 'mellifluous',
  'labyrinth', 'nebulous', 'pensive', 'euphoria', 'reverie', 'incandescent',
  'kismet', 'lucid', 'vivid', 'zenith', 'yearn', 'wanderlust',
  'solitude', 'quintessential', 'ravel', 'sublime', 'tenacious', 'unfurl',
  'verdant', 'whimsical', 'zealous', 'aplomb', 'buoyant', 'candor',
  'diaphanous', 'effervescent', 'fastidious', 'gossamer', 'harbinger', 'idyllic',
  'juxtapose', 'kindle', 'limpid', 'meander', 'nostalgia', 'obfuscate',
  'palpable', 'quaint', 'resonant', 'susurrus', 'tranquil', 'undulate',
  'venerate', 'wistful', 'nuance', 'poignant', 'ostensible', 'clandestine',
];

const daysSinceEpoch = (): number => {
  const now = new Date();
  const utcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(utcMidnight / 86_400_000);
};

export function wordOfTheDay(): string {
  const idx = daysSinceEpoch() % SEEDS.length;
  return SEEDS[idx];
}

// Stable key per-day so components can memoize / avoid re-fetching.
export function wordOfTheDayKey(): string {
  return `wotd-${daysSinceEpoch()}`;
}
