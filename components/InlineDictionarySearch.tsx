import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  UIManager,
  LayoutAnimation,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading, DefinitionResult } from '../context/ReadingContext';
import * as Speech from 'expo-speech';

const ipaToRespelling = (ipa: string): string => {
  if (!ipa) return '';
  let clean = ipa.replace(/^\/|\/$/g, '');
  
  const map: [RegExp, string][] = [
    [/tʃ/g, 'ch'],
    [/dʒ/g, 'j'],
    [/tsh/g, 'ch'],
    [/dzh/g, 'j'],
    [/iː/g, 'ee'],
    [/ɪ/g, 'ih'],
    [/e/g, 'eh'],
    [/æ/g, 'a'],
    [/ɑː/g, 'ah'],
    [/ɒ/g, 'o'],
    [/ɔː/g, 'aw'],
    [/ʊ/g, 'uu'],
    [/uː/g, 'oo'],
    [/ʌ/g, 'uh'],
    [/ɜː/g, 'ur'],
    [/ə/g, 'uh'],
    [/eɪ/g, 'ay'],
    [/aɪ/g, 'eye'],
    [/ɔɪ/g, 'oy'],
    [/oʊ/g, 'oh'],
    [/əʊ/g, 'oh'],
    [/aʊ/g, 'ow'],
    [/ɪə/g, 'eer'],
    [/eə/g, 'air'],
    [/ʊə/g, 'oor'],
    [/ʃ/g, 'sh'],
    [/ʒ/g, 'zh'],
    [/θ/g, 'th'],
    [/ð/g, 'th'],
    [/ng/g, 'ng'],
    [/j/g, 'y'],
    [/x/g, 'kh'],
    [/ʔ/g, '-'],
  ];

  let result = clean;
  for (const [regex, replacement] of map) {
    result = result.replace(regex, replacement);
  }

  const parts = result.split(/([ˈˌ])/);
  let finalParts: string[] = [];
  let capitalizeNext = false;
  
  for (const part of parts) {
    if (part === 'ˈ') {
      capitalizeNext = true;
    } else if (part === 'ˌ') {
      capitalizeNext = false;
    } else {
      let syllable = part.trim();
      if (syllable) {
        if (capitalizeNext) {
          syllable = syllable.toUpperCase();
          capitalizeNext = false;
        }
        finalParts.push(syllable);
      }
    }
  }

  return finalParts.join('-');
};

const LOCAL_DICT_FALLBACK: Record<string, DefinitionResult> = {
  resilient: {
    word: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
    partOfSpeech: 'adjective',
    definition: 'Able to withstand or recover quickly from difficult conditions; strong and adaptable.',
  },
  mindful: {
    word: 'mindful',
    phonetic: '/ˈmaɪndfl/',
    partOfSpeech: 'adjective',
    definition: 'Consciously aware of something; focusing on the present moment with acceptance and calm.',
  },
  reading: {
    word: 'reading',
    phonetic: '/ˈriːdɪŋ/',
    partOfSpeech: 'noun',
    definition: 'The action or skill of reading written or printed matter; an active pathway to quiet reflection.',
  },
  habit: {
    word: 'habit',
    phonetic: '/ˈhæbɪt/',
    partOfSpeech: 'noun',
    definition: 'A settled or regular tendency or practice, especially one that is hard to give up.',
  },
  calm: {
    word: 'calm',
    phonetic: '/kɑːm/',
    partOfSpeech: 'adjective',
    definition: 'Not showing or feeling nervousness, anger, or other strong emotions; peaceful.',
  },
};

interface InlineDictionarySearchProps {
  onOpenNotebook: () => void;
  onFocusChange?: (active: boolean) => void;
}

export const InlineDictionarySearch: React.FC<InlineDictionarySearchProps> = ({ onOpenNotebook, onFocusChange }) => {
  const { saveWord, removeWord, isWordSaved } = useReading();
  const [searchWord, setSearchWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DefinitionResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Animation values
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const active = isFocused || result !== null;
    if (onFocusChange) {
      onFocusChange(active);
    }
    Animated.timing(focusAnim, {
      toValue: active ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Animating width/shadow/border colors requires false
    }).start();
  }, [isFocused, result]);

  useEffect(() => {
    // Debounce Datamuse API for suggestions
    const timer = setTimeout(() => {
      if (searchWord.trim().length > 1 && !result) {
        fetch(`https://api.datamuse.com/sug?s=${searchWord.trim()}`)
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data)) {
              setSuggestions(data.slice(0, 4).map((d: any) => d.word));
            }
          })
          .catch(() => setSuggestions([]));
      } else {
        setSuggestions([]);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [searchWord, result]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakWord = async (word: string, audioUrl?: string) => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      if (audioUrl) {
        try {
          const { NativeModules } = require('react-native');
          const isAVAvailable = !!(
            NativeModules.ExponentAV ||
            NativeModules.ExpoAV ||
            (NativeModules.NativeModulesProxy && NativeModules.NativeModulesProxy.ExponentAV)
          );

          if (isAVAvailable) {
            const { Audio } = require('expo-av');
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              allowsRecordingIOS: false,
            });
            const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
            await sound.playAsync();
            return;
          }
        } catch (avError) {
          console.log('Native AV playback failed, falling back to TTS:', avError);
        }
      }

      // Natively synthesize speech using device's internal engine without redirecting/opening browsers
      setIsSpeaking(true);
      Speech.speak(word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      console.log('Speech synthesis failed:', e);
      setIsSpeaking(false);
    }
  };

  const parseDatamuseDefinition = (defStr: string) => {
    const parts = defStr.split('\t');
    if (parts.length >= 2) {
      const posCode = parts[0];
      let definition = parts[1];
      
      const posMap: Record<string, string> = {
        n: 'noun',
        v: 'verb',
        adj: 'adjective',
        adv: 'adverb',
        u: 'unknown'
      };
      const partOfSpeech = posMap[posCode] || posCode;
      
      const quoteIndex = definition.indexOf('"');
      if (quoteIndex !== -1) {
        definition = definition.substring(0, quoteIndex).trim();
      }
      if (definition.endsWith(';')) {
        definition = definition.substring(0, definition.length - 1).trim();
      }
      return { partOfSpeech, definition };
    }
    return { partOfSpeech: 'unknown', definition: defStr };
  };

  const handleSearch = async (wordToSearch?: string | any) => {
    const query = typeof wordToSearch === 'string' ? wordToSearch : searchWord;
    const targetWord = query.trim();
    if (!targetWord) return;

    Keyboard.dismiss();

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoading(true);
    setResult(null);

    const cleanWord = targetWord.toLowerCase();

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          let phoneticText = entry.phonetic || '';
          let audioUrlStr = '';
          if (entry.phonetics && entry.phonetics.length > 0) {
            const foundPhonetic = entry.phonetics.find((p: any) => p.text);
            if (foundPhonetic) phoneticText = foundPhonetic.text;
            
            const foundAudio = entry.phonetics.find((p: any) => p.audio && p.audio.length > 0);
            if (foundAudio) audioUrlStr = foundAudio.audio;
          }

          let defText = 'No definition found.';
          let posText = '';
          if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            posText = meaning.partOfSpeech || '';
            if (meaning.definitions && meaning.definitions.length > 0) {
              defText = meaning.definitions[0].definition;
            }
          }

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setResult({
            word: entry.word,
            phonetic: phoneticText,
            definition: defText,
            partOfSpeech: posText,
            audioUrl: audioUrlStr || undefined,
          });
          setLoading(false);
          return;
        }
      }

      // If first API failed or returned empty/404, fallback to Datamuse API which includes definitions
      try {
        const datamuseResponse = await fetch(`https://api.datamuse.com/words?sp=${cleanWord}&md=d&max=1`);
        if (datamuseResponse.ok) {
          const datamuseData = await datamuseResponse.json();
          if (datamuseData && datamuseData.length > 0 && datamuseData[0].defs && datamuseData[0].defs.length > 0) {
            const entry = datamuseData[0];
            const parsed = parseDatamuseDefinition(entry.defs[0]);
            
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setResult({
              word: entry.word,
              phonetic: `/${entry.word}/`,
              definition: parsed.definition,
              partOfSpeech: parsed.partOfSpeech,
            });
            setLoading(false);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn("Datamuse fallback failed", fallbackErr);
      }

      if (LOCAL_DICT_FALLBACK[cleanWord]) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResult(LOCAL_DICT_FALLBACK[cleanWord]);
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResult({
          word: searchWord.trim(),
          partOfSpeech: 'unknown',
          definition: `No definition found for this word.`,
        });
      }
    } catch (err) {
      // Catch-all fallback
      try {
        const datamuseResponse = await fetch(`https://api.datamuse.com/words?sp=${cleanWord}&md=d&max=1`);
        if (datamuseResponse.ok) {
          const datamuseData = await datamuseResponse.json();
          if (datamuseData && datamuseData.length > 0 && datamuseData[0].defs && datamuseData[0].defs.length > 0) {
            const entry = datamuseData[0];
            const parsed = parseDatamuseDefinition(entry.defs[0]);
            
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setResult({
              word: entry.word,
              phonetic: `/${entry.word}/`,
              definition: parsed.definition,
              partOfSpeech: parsed.partOfSpeech,
            });
            setLoading(false);
            return;
          }
        }
      } catch (fallbackErr) {}

      if (LOCAL_DICT_FALLBACK[cleanWord]) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResult(LOCAL_DICT_FALLBACK[cleanWord]);
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResult({
          word: searchWord.trim(),
          partOfSpeech: 'unknown',
          definition: `No definition found for this word.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchWord('');
    setResult(null);
    setSuggestions([]);
  };

  const wordAlreadySaved = result ? isWordSaved(result.word) : false;
  
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accent]
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.15]
  });

  const widthInterpolate = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['75%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Animated.View 
          style={[
            styles.searchContainer,
            { 
              width: widthInterpolate,
              borderColor: borderColor,
              shadowOpacity: shadowOpacity,
              elevation: isFocused || result ? 6 : 3,
            }
          ]}
        >
        <Ionicons name="search" size={20} color={isFocused ? COLORS.accent : COLORS.mutedText} style={styles.searchIcon} />
        
        <TextInput
          style={styles.input}
          placeholder="Ask dictionary... (e.g. mindful)"
          placeholderTextColor={COLORS.mutedText}
          value={searchWord}
          onChangeText={setSearchWord}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchWord.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.mutedText} />
          </TouchableOpacity>
        )}
        
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.loadingIndicator} />
        ) : (
          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              (searchWord || result) ? styles.actionBtnActive : null,
              result ? { backgroundColor: COLORS.danger } : null
            ]} 
            onPress={result ? handleClear : searchWord ? () => handleSearch(searchWord) : onOpenNotebook}
          >
            <Ionicons 
              name={result ? "close" : searchWord ? "arrow-up" : "bookmarks"} 
              size={16} 
              color={(searchWord || result) ? COLORS.white : COLORS.accent} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && !result && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((sug) => (
            <TouchableOpacity 
              key={sug} 
              style={styles.suggestionItem}
              onPress={() => {
                setSearchWord(sug);
                setSuggestions([]);
                handleSearch(sug);
              }}
            >
              <Ionicons name="search-outline" size={14} color={COLORS.mutedText} />
              <Text style={styles.suggestionText}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      </View>

      {/* Result Card inline */}
      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <View style={styles.wordInfo}>
              <Text style={styles.wordTitle}>{result.word}</Text>
              <View style={styles.phoneticRow}>
                {result.phonetic && <Text style={styles.phoneticText}>{result.phonetic}</Text>}
                {result.phonetic && ipaToRespelling(result.phonetic) ? (
                  <Text style={styles.respellingText}> [{ipaToRespelling(result.phonetic)}]</Text>
                ) : null}
                <TouchableOpacity onPress={() => speakWord(result.word, result.audioUrl)} style={styles.audioBtn}>
                  <Ionicons name={isSpeaking ? "stop-circle" : "volume-medium"} size={16} color={isSpeaking ? COLORS.gold : COLORS.accent} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{result.partOfSpeech}</Text>
            </View>
          </View>
          
          <Text style={styles.definitionText}>{result.definition}</Text>
          
          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={[styles.saveBtn, wordAlreadySaved && styles.saveBtnActive]}
              onPress={() => { 
                if (wordAlreadySaved) {
                  removeWord(result.word);
                } else {
                  saveWord(result); 
                }
              }}
            >
              <Ionicons 
                name={wordAlreadySaved ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={wordAlreadySaved ? COLORS.white : COLORS.accent} 
              />
              <Text style={[styles.saveBtnText, wordAlreadySaved && styles.saveBtnTextActive]}>
                {wordAlreadySaved ? 'Unsave Word' : 'Save Word'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
    marginBottom: 40,
  },
  searchWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    paddingVertical: 8,
  },
  iconBtn: {
    padding: 4,
    marginRight: 4,
  },
  loadingIndicator: {
    marginHorizontal: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  actionBtnActive: {
    backgroundColor: COLORS.accent,
  },
  
  /* Results */
  resultContainer: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  wordInfo: {
    flex: 1,
  },
  wordTitle: {
    fontSize: 22,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'lowercase',
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneticText: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
  respellingText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  audioBtn: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderRadius: 12,
  },
  posBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  posText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  definitionText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
  },
  saveBtnActive: {
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 6,
  },
  saveBtnTextActive: {
    color: COLORS.white,
  }
});
