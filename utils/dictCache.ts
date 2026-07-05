// Tiny in-memory LRU cache for network-fetched dictionary payloads.
// Lives at module scope so it persists across component mounts within a
// single JS session. Not persisted to disk — a fresh app launch pays the
// network round-trip once and then hits the cache for every re-search
// (definitions, related words, etymology, rarity).
//
// Why not AsyncStorage? Dictionary responses can be a few KB each and the
// serialization cost eats the win for our access pattern. In-memory is
// instant. If you want durable caching later, wrap this with a background
// AsyncStorage sync.

const MAX_ENTRIES = 200;

const store = new Map<string, unknown>();

const key = (bucket: string, term: string) => `${bucket}:${term.toLowerCase().trim()}`;

export function cacheGet<T>(bucket: string, term: string): T | undefined {
  const k = key(bucket, term);
  if (!store.has(k)) return undefined;
  // Bump to MRU position by delete + re-set.
  const val = store.get(k) as T;
  store.delete(k);
  store.set(k, val);
  return val;
}

export function cacheSet<T>(bucket: string, term: string, value: T): void {
  const k = key(bucket, term);
  if (store.has(k)) store.delete(k);
  store.set(k, value);
  if (store.size > MAX_ENTRIES) {
    // Delete the least-recently-used (first key by insertion order).
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}

export function cacheClear(): void {
  store.clear();
}
