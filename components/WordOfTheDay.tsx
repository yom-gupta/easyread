import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useReading, DefinitionResult } from '../context/ReadingContext';
import { wordOfTheDay, wordOfTheDayKey } from '../utils/wordOfTheDay';
import { haptics } from '../utils/haptics';
import { analytics, EVENTS } from '../services/analytics';

interface Props {
  onTap?: (word: string) => void;
}

const DISMISS_KEY = 'wotd_dismissed_key';

// Minimal single-row Word-of-the-Day. Lives on top of the vocab notebook
// list. Dismissible per-day (X button); auto-shows again next day.
export const WordOfTheDay: React.FC<Props> = ({ onTap }) => {
  const { saveWord, removeWord, isWordSaved } = useReading();
  const [word] = useState(wordOfTheDay());
  const [def, setDef] = useState<string>('');
  const [pos, setPos] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;

  // Load persisted dismissal for today's key.
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(DISMISS_KEY);
        setDismissed(seen === wordOfTheDayKey());
      } catch {
        setDismissed(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!res.ok) throw new Error('miss');
        const data = await res.json();
        const meaning = data?.[0]?.meanings?.[0];
        const firstDef = meaning?.definitions?.[0]?.definition;
        if (!cancelled && firstDef) {
          setDef(firstDef);
          setPos(meaning.partOfSpeech || '');
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [word, dismissed]);

  useEffect(() => {
    if (!loading && !dismissed) {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [loading, dismissed]);

  if (dismissed !== false) return null; // null while loading dismissal state OR dismissed

  const saved = isWordSaved(word);

  const onSaveToggle = () => {
    haptics.tapMedium();
    if (saved) {
      removeWord(word);
      return;
    }
    const payload: DefinitionResult = {
      word, phonetic: '',
      definition: def || '',
      partOfSpeech: pos || '',
    };
    saveWord(payload);
    analytics.logEvent(EVENTS.wotd_saved, { word: word.slice(0, 40) });
  };

  const onDismiss = async () => {
    haptics.tapLight();
    analytics.logEvent(EVENTS.wotd_dismissed, { word: word.slice(0, 40) });
    try { await AsyncStorage.setItem(DISMISS_KEY, wordOfTheDayKey()); } catch { /* silent */ }
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDismissed(true);
    });
  };

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.body}
        onPress={() => onTap && onTap(word)}
        accessibilityRole="button"
        accessibilityLabel={`Word of the day: ${word}`}
      >
        <View style={styles.eyebrowRow}>
          <Ionicons name="sunny-outline" size={11} color={COLORS.gold} />
          <Text style={styles.eyebrow}>WORD OF THE DAY</Text>
        </View>
        <View style={styles.mainRow}>
          <Text style={styles.word} numberOfLines={1}>{word}</Text>
          {pos ? <Text style={styles.pos}>· {pos}</Text> : null}
        </View>
        <Text style={styles.def} numberOfLines={1}>
          {loading ? '…' : def || 'Tap to explore.'}
        </Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onSaveToggle}
          disabled={loading}
          style={styles.iconBtn}
          accessibilityLabel={saved ? 'Unsave word' : 'Save word'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? COLORS.accent : COLORS.mutedText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.iconBtn}
          accessibilityLabel="Hide word of the day"
        >
          <Ionicons name="close" size={18} color={COLORS.mutedText} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(197, 168, 128, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    borderRadius: 8,
  },
  body: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
    fontFamily: FONTS.medium,
  },
  mainRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  word: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  pos: { fontSize: 11, color: COLORS.mutedText, fontStyle: 'italic' },
  def: { fontSize: 12, color: COLORS.mutedText, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 6 },
});
