import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Keyboard,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { useReading, DefinitionResult } from '../context/ReadingContext';
import * as Speech from 'expo-speech';
import LottieView from 'lottie-react-native';

const ipaToRespelling = (ipa: string): string => {
  if (!ipa) return '';
  let clean = ipa.replace(/^\/|\/$/g, '');

  const map: [RegExp, string][] = [
    [/tʃ/g, 'ch'], [/dʒ/g, 'j'], [/tsh/g, 'ch'], [/dzh/g, 'j'],
    [/iː/g, 'ee'], [/ɪ/g, 'ih'], [/e/g, 'eh'], [/æ/g, 'a'],
    [/ɑː/g, 'ah'], [/ɒ/g, 'o'], [/ɔː/g, 'aw'], [/ʊ/g, 'uu'],
    [/uː/g, 'oo'], [/ʌ/g, 'uh'], [/ɜː/g, 'ur'], [/ə/g, 'uh'],
    [/eɪ/g, 'ay'], [/aɪ/g, 'eye'], [/ɔɪ/g, 'oy'], [/oʊ/g, 'oh'],
    [/əʊ/g, 'oh'], [/aʊ/g, 'ow'], [/ɪə/g, 'eer'], [/eə/g, 'air'],
    [/ʊə/g, 'oor'], [/ʃ/g, 'sh'], [/ʒ/g, 'zh'], [/θ/g, 'th'],
    [/ð/g, 'th'], [/ng/g, 'ng'], [/j/g, 'y'], [/x/g, 'kh'], [/ʔ/g, '-'],
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

interface DefinitionEntry {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface MeaningEntry {
  partOfSpeech: string;
  definitions: DefinitionEntry[];
}

interface FullResult {
  word: string;
  phonetic: string;
  audioUrl?: string;
  meanings: MeaningEntry[];
}

interface InlineDictionarySearchProps {
  onOpenNotebook: () => void;
  onFocusChange?: (active: boolean) => void;
}

export const InlineDictionarySearch: React.FC<InlineDictionarySearchProps> = ({ onOpenNotebook, onFocusChange }) => {
  const { saveWord, removeWord, isWordSaved } = useReading();
  const [searchWord, setSearchWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [relatedWords, setRelatedWords] = useState<string[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const defOpacity = useRef(new Animated.Value(0)).current;
  const exampleOpacity = useRef(new Animated.Value(0)).current;
  const synOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  const saveLottieRef = useRef<LottieView>(null);
  const [isSaving, setIsSaving] = useState(false);
  const thinkingLottieRef = useRef<LottieView>(null);
  const sparkleLottieRef = useRef<LottieView>(null);
  const [showSparkleLottie, setShowSparkleLottie] = useState(false);
  const sparkleIconOpacity = useRef(new Animated.Value(1)).current;
  const saveBtnOpacity = useRef(new Animated.Value(1)).current;

  const cleanupReveal = () => {
    titleOpacity.setValue(0);
    defOpacity.setValue(0);
    exampleOpacity.setValue(0);
    synOpacity.setValue(0);
    bottomOpacity.setValue(0);
  };

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: (isFocused || result !== null) ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, result, expandAnim]);

  useEffect(() => {
    if (onFocusChange) onFocusChange(isFocused || result !== null);
  }, [isFocused, result, onFocusChange]);

  useEffect(() => {
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

  useEffect(() => {
    if (!result || loading) {
      cleanupReveal();
      return;
    }

    titleOpacity.setValue(0);
    defOpacity.setValue(0);
    exampleOpacity.setValue(0);
    synOpacity.setValue(0);
    bottomOpacity.setValue(0);

    const t1 = setTimeout(() => {
      Animated.timing(titleOpacity, { toValue: 1, duration: 120, useNativeDriver: false }).start();
    }, 0);

    const t2 = setTimeout(() => {
      Animated.timing(defOpacity, { toValue: 1, duration: 120, useNativeDriver: false }).start();
    }, 60);

    const hasExample = !!result.meanings[0]?.definitions[0]?.example;
    const hasSynonyms = (result.meanings[0]?.definitions[0]?.synonyms?.length || 0) > 0;

    const t3 = setTimeout(() => {
      if (hasExample) {
        Animated.timing(exampleOpacity, { toValue: 1, duration: 120, useNativeDriver: false }).start();
      }
    }, hasExample ? 120 : 0);

    const t4 = setTimeout(() => {
      if (hasSynonyms) {
        Animated.timing(synOpacity, { toValue: 1, duration: 120, useNativeDriver: false }).start();
      }
    }, hasSynonyms ? 180 : 0);

    const t5 = setTimeout(() => {
      Animated.timing(bottomOpacity, { toValue: 1, duration: 120, useNativeDriver: false }).start();
    }, 240);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [result, loading]);

  useEffect(() => {
    if (result && !loading) {
      setShowSparkleLottie(true);
      sparkleIconOpacity.setValue(0);
      Animated.timing(sparkleIconOpacity, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      const timer = setTimeout(() => {
        Animated.timing(sparkleIconOpacity, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
          setShowSparkleLottie(false);
          sparkleIconOpacity.setValue(1);
        });
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [result, loading]);

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
        } catch {
          // Native AV playback failed, falling back to TTS
        }
      }

      setIsSpeaking(true);
      Speech.speak(word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      // Speech synthesis failed
      setIsSpeaking(false);
    }
  };

  const parseDatamuseDefinition = (defStr: string) => {
    const parts = defStr.split('\t');
    if (parts.length >= 2) {
      const posCode = parts[0];
      let definition = parts[1];

      const posMap: Record<string, string> = {
        n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: 'unknown',
      };
      const partOfSpeech = posMap[posCode] || posCode;

      const quoteIndex = definition.indexOf('"');
      if (quoteIndex !== -1) definition = definition.substring(0, quoteIndex).trim();
      if (definition.endsWith(';')) definition = definition.substring(0, definition.length - 1).trim();
      return { partOfSpeech, definition };
    }
    return { partOfSpeech: 'unknown', definition: defStr };
  };

  const fetchRelatedWords = async (word: string) => {
    setRelatedLoading(true);
    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=6`);
      const data = await res.json();
      if (data && Array.isArray(data)) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRelatedWords(data.map((d: any) => d.word));
      }
    } catch {
      setRelatedWords([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleSearch = async (wordToSearch?: string | any) => {
    const query = typeof wordToSearch === 'string' ? wordToSearch : searchWord;
    const targetWord = query.trim();
    if (!targetWord) return;

    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    cleanupReveal();
    setLoading(true);
    setResult(null);
    setShowMoreDetails(false);
    setRelatedWords([]);

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

          const meanings: MeaningEntry[] = (entry.meanings || []).map((m: any) => ({
            partOfSpeech: m.partOfSpeech || '',
            definitions: (m.definitions || []).map((d: any) => ({
              definition: d.definition || 'No definition found.',
              example: d.example || undefined,
              synonyms: d.synonyms || [],
              antonyms: d.antonyms || [],
            })),
          }));

          setResult({
            word: entry.word,
            phonetic: phoneticText,
            audioUrl: audioUrlStr || undefined,
            meanings,
          });
          setLoading(false);
          fetchRelatedWords(cleanWord);
          return;
        }
      }

      try {
        const datamuseResponse = await fetch(`https://api.datamuse.com/words?sp=${cleanWord}&md=d&max=1`);
        if (datamuseResponse.ok) {
          const datamuseData = await datamuseResponse.json();
          if (datamuseData && datamuseData.length > 0 && datamuseData[0].defs && datamuseData[0].defs.length > 0) {
            const entry = datamuseData[0];
            const parsed = parseDatamuseDefinition(entry.defs[0]);

            setResult({
              word: entry.word,
              phonetic: `/${entry.word}/`,
              meanings: [{
                partOfSpeech: parsed.partOfSpeech,
                definitions: [{ definition: parsed.definition, synonyms: [], antonyms: [] }],
              }],
            });
            setLoading(false);
            fetchRelatedWords(cleanWord);
            return;
          }
        }
      } catch {
        // Datamuse fallback failed
      }

      setResult({
        word: searchWord.trim(),
        phonetic: '',
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{ definition: 'No definition found for this word.', synonyms: [], antonyms: [] }],
        }],
      });
    } catch (err) {
      try {
        const datamuseResponse = await fetch(`https://api.datamuse.com/words?sp=${cleanWord}&md=d&max=1`);
        if (datamuseResponse.ok) {
          const datamuseData = await datamuseResponse.json();
          if (datamuseData && datamuseData.length > 0 && datamuseData[0].defs && datamuseData[0].defs.length > 0) {
            const entry = datamuseData[0];
            const parsed = parseDatamuseDefinition(entry.defs[0]);

            setResult({
              word: entry.word,
              phonetic: `/${entry.word}/`,
              meanings: [{
                partOfSpeech: parsed.partOfSpeech,
                definitions: [{ definition: parsed.definition, synonyms: [], antonyms: [] }],
              }],
            });
            setLoading(false);
            fetchRelatedWords(cleanWord);
            return;
          }
        }
      } catch (fallbackErr) { }

      setResult({
        word: searchWord.trim(),
        phonetic: '',
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{ definition: 'No definition found for this word.', synonyms: [], antonyms: [] }],
        }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    cleanupReveal();
    swipeAnim.setValue(0);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchWord('');
    setResult(null);
    setSuggestions([]);
    setRelatedWords([]);
    setShowMoreDetails(false);
  };

  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        swipeAnim.setValue(Math.max(0, gs.dy));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120) {
          Animated.timing(swipeAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: false,
          }).start(() => handleClear());
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const wordAlreadySaved = result ? isWordSaved(result.word) : false;
  const firstMeaning = result?.meanings[0];
  const firstDef = firstMeaning?.definitions[0];
  const totalDefs = result?.meanings.reduce((s, m) => s + m.definitions.length, 0) || 0;

  const searchBarMarginTop = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 4],
  });

  const searchBarWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['80%', '100%'],
  });

  const borderColor = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accent],
  });

  const shadowOpacityAnim = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.15],
  });

  const swipeCardOpacity = swipeAnim.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleSavePress = () => {
    if (!result) return;
    Animated.timing(saveBtnOpacity, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
      if (wordAlreadySaved) {
        removeWord(result.word);
      } else {
        setIsSaving(true);
        saveLottieRef.current?.play();
        setTimeout(() => {
          const defResult: DefinitionResult = {
            word: result.word,
            phonetic: result.phonetic,
            definition: firstDef?.definition || '',
            partOfSpeech: firstMeaning?.partOfSpeech || '',
            audioUrl: result.audioUrl,
          };
          saveWord(defResult);
        }, 600);
        setTimeout(() => {
          setIsSaving(false);
          saveLottieRef.current?.reset();
        }, 1200);
      }
      Animated.timing(saveBtnOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchWrapper, { marginTop: searchBarMarginTop }]}>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              width: searchBarWidth,
              borderColor: borderColor,
              shadowOpacity: shadowOpacityAnim,
              elevation: isFocused || result ? 6 : 3,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={isFocused ? COLORS.accent : COLORS.mutedText} style={styles.searchIcon} />

          <TextInput
            style={styles.input}
            placeholder="Ask dictionary..."
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
            <View style={styles.thinkingLottieWrap}>
              <LottieView
                ref={thinkingLottieRef}
                source={require('../assets/animations/Sparkles Loop Loader ai.json')}
                autoPlay
                loop
                style={styles.thinkingLottie}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                (searchWord || result) ? styles.actionBtnActive : null,
                result ? { backgroundColor: COLORS.danger } : null,
              ]}
              onPress={result ? handleClear : searchWord ? () => handleSearch(searchWord) : onOpenNotebook}
            >
              <Ionicons
                name={result ? 'close' : searchWord ? 'arrow-up' : 'bookmarks'}
                size={16}
                color={(searchWord || result) ? COLORS.white : COLORS.accent}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

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
      </Animated.View>

      {result && (
        <Animated.View
          style={[
            styles.resultCardOuter,
            {
              transform: [{ translateY: swipeAnim }],
              opacity: swipeCardOpacity,
              marginTop: loading ? 0 : 16,
            },
          ]}
          {...swipePanResponder.panHandlers}
        >
          <View style={styles.resultCardInner}>
            <View style={styles.accentBar} />

            <Animated.View style={{ opacity: titleOpacity }}>
              <View style={styles.resultHeader}>
                <View style={styles.wordInfo}>
                  <View style={styles.wordTitleRow}>
                    <Animated.View style={[styles.sparkleIconWrap, { opacity: sparkleIconOpacity }]}>
                      {showSparkleLottie ? (
                        <LottieView
                          ref={sparkleLottieRef}
                          source={require('../assets/animations/Sparkles Loop Loader ai.json')}
                          autoPlay
                          loop={false}
                          style={styles.sparkleLottie}
                        />
                      ) : (
                        <Ionicons name="sparkles" size={16} color={COLORS.gold} />
                      )}
                    </Animated.View>
                    <Text style={styles.wordTitle}>{result.word}</Text>
                  </View>
                  <View style={styles.phoneticRow}>
                    {result.phonetic ? (
                      <Text style={styles.phoneticText}>{result.phonetic}</Text>
                    ) : null}
                    {result.phonetic && ipaToRespelling(result.phonetic) ? (
                      <Text style={styles.respellingText}> [{ipaToRespelling(result.phonetic)}]</Text>
                    ) : null}
                    <TouchableOpacity onPress={() => speakWord(result.word, result.audioUrl)} style={styles.audioBtn}>
                      <Ionicons
                        name={isSpeaking ? 'stop-circle' : 'volume-medium'}
                        size={16}
                        color={isSpeaking ? COLORS.gold : COLORS.accent}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {firstMeaning && (
                  <View style={styles.posBadge}>
                    <Text style={styles.posText}>{firstMeaning.partOfSpeech}</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            <Animated.View style={[styles.definitionBody, { opacity: defOpacity }]}>
              {firstDef && (
                <Text style={styles.definitionText}>{firstDef.definition}</Text>
              )}
            </Animated.View>

            <Animated.View style={{ opacity: exampleOpacity }}>
              {firstDef?.example && (
                <View style={styles.exampleBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#94A3B8" />
                  <Text style={styles.exampleText}>"{firstDef.example}"</Text>
                </View>
              )}
            </Animated.View>

            {firstMeaning && firstMeaning.definitions.length > 0 && (
              <>
                <Animated.View style={{ opacity: synOpacity }}>
                  {firstMeaning.definitions[0].synonyms.length > 0 && (
                    <View style={styles.synSection}>
                      <Text style={styles.synLabel}>Similar</Text>
                      <View style={styles.synChips}>
                        {firstMeaning.definitions[0].synonyms.slice(0, 5).map((syn) => (
                          <TouchableOpacity
                            key={syn}
                            style={styles.synChip}
                            onPress={() => {
                              setSearchWord(syn);
                              handleSearch(syn);
                            }}
                          >
                            <Text style={styles.synChipText}>{syn}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </Animated.View>

                {totalDefs > 1 && (
                  <>
                    <View style={styles.sectionDivider} />
                    <TouchableOpacity
                      style={[styles.moreBtn, { opacity: 1 }]}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowMoreDetails(!showMoreDetails);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moreBtnText}>
                        {showMoreDetails ? 'Less Details' : `More Details (${totalDefs - 1} more)`}
                      </Text>
                      <Ionicons
                        name={showMoreDetails ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={COLORS.accent}
                      />
                    </TouchableOpacity>
                  </>
                )}

                {showMoreDetails && (
                  <View style={styles.moreDetails}>
                    {result.meanings.map((meaning, mi) =>
                      meaning.definitions.map((def, di) => {
                        const isFirst = mi === 0 && di === 0;
                        if (isFirst) return null;
                        return (
                          <View key={`${mi}-${di}`} style={styles.extraDefBlock}>
                            <View style={styles.extraDefHeader}>
                              <Text style={styles.extraDefPos}>{meaning.partOfSpeech}</Text>
                              <Text style={styles.extraDefNum}>{di + 1}</Text>
                            </View>
                            <Text style={styles.extraDefText}>{def.definition}</Text>
                            {def.example && (
                              <Text style={styles.extraExample}>"{def.example}"</Text>
                            )}
                            {def.synonyms.length > 0 && (
                              <View style={styles.synChips}>
                                {def.synonyms.slice(0, 4).map((syn) => (
                                  <TouchableOpacity
                                    key={syn}
                                    style={styles.synChip}
                                    onPress={() => {
                                      setSearchWord(syn);
                                      handleSearch(syn);
                                    }}
                                  >
                                    <Text style={styles.synChipText}>{syn}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      }),
                    )}
                  </View>
                )}
              </>
            )}

            <Animated.View style={{ opacity: bottomOpacity }}>
              {relatedWords.length > 0 && (
                <View style={styles.relatedSection}>
                  <View style={styles.relatedHeader}>
                    <Ionicons name="sparkles" size={14} color={COLORS.gold} />
                    <Text style={styles.relatedLabel}>Smart Related</Text>
                  </View>
                  <View style={styles.synChips}>
                    {relatedWords.map((w) => (
                      <TouchableOpacity
                        key={w}
                        style={styles.relatedChip}
                        onPress={() => {
                          setSearchWord(w);
                          handleSearch(w);
                        }}
                      >
                        <Text style={styles.relatedChipText}>{w}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.resultActions}>
                <Animated.View style={{ opacity: saveBtnOpacity }}>
                  <TouchableOpacity
                    style={[styles.saveBtn, wordAlreadySaved && styles.saveBtnActive]}
                    onPress={handleSavePress}
                    disabled={isSaving}
                  >
                    {wordAlreadySaved ? (
                      <Ionicons name="bookmark" size={16} color={COLORS.white} />
                    ) : (
                      <LottieView
                        ref={saveLottieRef}
                        source={require('../assets/animations/save.json')}
                        loop={false}
                        style={styles.saveLottie}
                      />
                    )}
                    <Text style={[styles.saveBtnText, wordAlreadySaved && styles.saveBtnTextActive]}>
                      {wordAlreadySaved ? 'Unsave Word' : 'Save Word'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 40,
  },
  searchWrapper: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    paddingVertical: 8,
  },
  iconBtn: {
    padding: 6,
    marginRight: 4,
  },
  thinkingLottieWrap: {
    width: 40,
    height: 40,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingLottie: {
    width: 56,
    height: 56,
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
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  actionBtnActive: {
    backgroundColor: COLORS.accent,
  },

  resultCardOuter: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  resultCardInner: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  accentBar: {
    height: 4,
    backgroundColor: COLORS.accent,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 12,
  },
  wordInfo: {
    flex: 1,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  sparkleIconWrap: {
    width: 22,
    height: 22,
    marginRight: 6,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleLottie: {
    width: 28,
    height: 28,
  },
  wordTitle: {
    fontSize: 26,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: '#1A2E40',
    letterSpacing: -0.5,
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneticText: {
    fontSize: 15,
    color: '#94A3B8',
    fontFamily: 'System',
  },
  respellingText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
    fontStyle: 'italic',
    marginLeft: 2,
  },
  audioBtn: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    borderRadius: 14,
  },
  posBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.15)',
  },
  posText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  definitionBody: {
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
    fontFamily: FONTS.regular,
  },
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#94A3B8',
    lineHeight: 20,
    flex: 1,
  },

  synSection: {
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 4,
  },
  synLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  synChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synChip: {
    backgroundColor: 'rgba(74, 124, 89, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  synChipText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },

  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    marginHorizontal: 24,
    marginVertical: 4,
  },

  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginHorizontal: 24,
  },
  moreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  moreDetails: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  extraDefBlock: {
    marginBottom: 18,
    paddingLeft: 14,
    borderLeftWidth: 2.5,
    borderLeftColor: 'rgba(74, 124, 89, 0.2)',
  },
  extraDefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  extraDefPos: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extraDefNum: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  extraDefText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  extraExample: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },

  relatedSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(197, 168, 128, 0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  relatedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  relatedChip: {
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  relatedChipText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },

  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.15)',
  },
  saveBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  saveLottie: {
    width: 22,
    height: 22,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 7,
  },
  saveBtnTextActive: {
    color: COLORS.white,
  },
});
