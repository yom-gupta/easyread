import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { COLORS } from '../constants/theme';

// A minimal English stop-word set. We DON'T link these because tapping
// "the" or "of" isn't useful and it makes the definition look like a
// blob of links. Everything else with 3+ letters becomes a live word.
const STOPWORDS = new Set([
  'a','an','the','of','to','in','on','at','by','for','with','from','into','onto','upon',
  'is','are','was','were','be','been','being','am','has','have','had','do','does','did',
  'and','or','but','so','if','then','that','this','these','those','it','its','as','than',
  'such','no','not','any','some','all','one','two','more','most','less','other','another',
  'each','every','own','same','very','just','only','up','down','out','off','over','under',
  'again','further','here','there','when','where','why','how','what','which','who','whom',
  'whose','my','your','his','her','our','their','they','them','we','us','you','i','me',
  'mine','ours','yours','theirs','also','can','could','would','should','shall','will',
  'may','might','must','ought','let','get','got','make','made','way','use','used',
]);

const isLinkable = (raw: string, currentWord?: string): boolean => {
  if (!raw) return false;
  if (!/^[A-Za-z][A-Za-z'-]{2,}$/.test(raw)) return false;
  const lower = raw.toLowerCase();
  if (STOPWORDS.has(lower)) return false;
  if (currentWord && lower === currentWord.toLowerCase()) return false;
  return true;
};

interface Props {
  text: string;
  // The word currently being defined — we don't link back to itself.
  currentWord?: string;
  onWordPress: (word: string) => void;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
}

export const LinkedText: React.FC<Props> = ({ text, currentWord, onWordPress, style, linkStyle }) => {
  // Split into tokens while keeping whitespace and punctuation as their own
  // pieces, so we can wrap only the actual word portion in a Pressable Text
  // and preserve spacing/punctuation exactly.
  const tokens = text.split(/(\s+|[^\w'-]+)/).filter(t => t.length > 0);

  return (
    <Text style={style}>
      {tokens.map((tok, i) => {
        // Extract the alphabetic core in case token still has trailing bits.
        const wordMatch = tok.match(/^([A-Za-z][A-Za-z'-]*)/);
        const core = wordMatch ? wordMatch[1] : '';
        if (core && isLinkable(core, currentWord)) {
          const rest = tok.slice(core.length);
          return (
            <Text key={i}>
              <Text
                onPress={() => onWordPress(core.toLowerCase())}
                style={[defaultLinkStyle, linkStyle]}
                accessibilityRole="link"
                accessibilityLabel={`Look up ${core}`}
              >
                {core}
              </Text>
              {rest ? <Text>{rest}</Text> : null}
            </Text>
          );
        }
        return <Text key={i}>{tok}</Text>;
      })}
    </Text>
  );
};

// Softer than pure accent — reads as "clickable" but doesn't compete with
// body text. No underline; the color contrast alone signals interactivity.
const defaultLinkStyle: TextStyle = {
  color: '#6B8F76',
  fontWeight: '600',
};
