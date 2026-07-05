import { cacheGet, cacheSet } from '../utils/dictCache';

// Minimal Wiktionary etymology fetcher.
// Wiktionary wikitext for etymology is a soup of nested templates like
// {{inh|en|ine-pro|*sanc-}}, {{der|en|la|sanctus}} and prose. We aggressively
// unwrap templates, then apply a QUALITY GATE so junk never renders in the UI.

const WIKI_URL = (word: string) =>
  `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;

// Templates whose LAST positional arg is the term we care about, so we
// substitute the whole call with that arg. Covers 90% of etymology templates.
const TERM_TEMPLATES = new Set([
  'inh', 'inherit', 'inh+',
  'der', 'derived',
  'bor', 'borrowed', 'bor+',
  'lbor', 'learned borrowing',
  'cog', 'cognate',
  'm', 'mention', 'l', 'link',
  'ncog', 'noncog',
  'af', 'affix', 'prefix', 'suffix',
]);

// Language codes we DON'T want leaked into the final text.
const LANG_CODE = /^[a-z]{2,3}(-[a-z]{2,4})?$/;

const stripTemplates = (input: string): string => {
  let s = input;
  // Repeat several times because templates nest.
  for (let pass = 0; pass < 5; pass++) {
    const before = s;
    s = s.replace(/\{\{([^{}]+)\}\}/g, (_full, inner: string) => {
      const parts = inner.split('|').map(p => p.trim());
      const name = (parts[0] || '').toLowerCase();

      if (TERM_TEMPLATES.has(name)) {
        // Drop leading language codes; pick the last non-code positional.
        const positional = parts.slice(1).filter(p => !p.includes('='));
        const words = positional.filter(p => p && !LANG_CODE.test(p));
        // Prefer the middle-ish "term" positional (usually index 1 or 2 in the call).
        return words[words.length - 1] || '';
      }
      // Templates like {{glossary|foo|bar}} → prefer the display arg.
      if (name === 'glossary' || name === 'w') {
        return parts[2] || parts[1] || '';
      }
      // Anything else: drop.
      return '';
    });
    if (s === before) break;
  }
  return s;
};

const stripMarkup = (s: string): string =>
  s
    // Wiki links [[a|b]] → b, [[a]] → a
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    // HTML tags
    .replace(/<[^>]+>/g, '')
    // Refs
    .replace(/<ref[^>]*>.*?<\/ref>/gi, '')
    // Bold/italic
    .replace(/'{2,}/g, '')
    // Any residual pipes / stray template braces
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\|+/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Repair " ," and " ." from removed tokens
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/[,;]\s*(?=[.;])/g, '')
    .trim();

// Quality gate — reject junk output. If we can't get a clean line we'd
// rather show nothing than "ine-pro From la; compare foo".
const isGoodEtymology = (s: string): boolean => {
  if (!s) return false;
  if (s.length < 24) return false;
  const first = s.split(/\s+/)[0] || '';
  if (LANG_CODE.test(first)) return false;
  // Must start with an uppercase letter or "From" (typical Wiktionary opener).
  if (!/^[A-Z]/.test(first)) return false;
  // Reject if it's mostly a "compare X" or "see X" one-liner (low signal).
  if (/^(Compare|See|Cf\.?)\b/i.test(s)) return false;
  return true;
};

export async function fetchEtymology(word: string, signal?: AbortSignal): Promise<string> {
  const cached = cacheGet<string>('etym', word);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(WIKI_URL(word), { signal });
    if (!res.ok) { cacheSet('etym', word, ''); return ''; }
    const data = await res.json();
    const wikitext: string = data?.parse?.wikitext?.['*'] || '';
    if (!wikitext) return '';

    // Scope to the English section then find the first Etymology heading.
    const enIdx = wikitext.indexOf('==English==');
    const scope = enIdx >= 0 ? wikitext.slice(enIdx) : wikitext;
    const etyMatch = scope.match(/===\s*Etymology[^=]*===\s*\n([\s\S]*?)(?=\n===|\n==[^=])/);
    if (!etyMatch) return '';

    const cleaned = stripMarkup(stripTemplates(etyMatch[1]));

    // First sentence, then a max-length cap.
    const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
    const trimmed = firstSentence.length > 180 ? firstSentence.slice(0, 177) + '…' : firstSentence;

    const out = isGoodEtymology(trimmed) ? trimmed : '';
    cacheSet('etym', word, out);
    return out;
  } catch {
    return '';
  }
}
