import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading, DefinitionResult } from '../context/ReadingContext';
import { WordOfTheDay } from './WordOfTheDay';
import { haptics } from '../utils/haptics';
import { useAndroidBack } from '../utils/useAndroidBack';
import { analytics, EVENTS } from '../services/analytics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface VocabLookupModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'search' | 'notebook';

export const VocabLookupModal: React.FC<VocabLookupModalProps> = ({ visible, onClose }) => {
  const { saveWord, removeWord, isWordSaved, vocabNotebook } = useReading();

  const confirmRemove = (w: string) => {
    haptics.tapLight();
    Alert.alert(
      'Remove word?',
      `"${w}" will be removed from your notebook.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            haptics.warning();
            removeWord(w);
          },
        },
      ],
    );
  };

  const activeTab: TabType = 'notebook';
  const [searchWord, setSearchWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DefinitionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Animation values
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(20)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      panY.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      // Sheet slides up, backdrop fades in
      Animated.parallel([
        Animated.spring(panY, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isDismissing.current) {
      Animated.parallel([
        Animated.timing(panY, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        panY.setValue(Math.max(0, gs.dy));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120) {
          isDismissing.current = true;
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: false,
          }).start(() => onClose());
        } else {
          Animated.spring(panY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Animate result card in when result changes
  useEffect(() => {
    if (result) {
      resultFade.setValue(0);
      resultSlide.setValue(16);
      Animated.parallel([
        Animated.timing(resultFade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(resultSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [result]);

  const handleSearch = async () => {
    if (!searchWord.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setShowShareCard(false);
    setShareFeedback(null);
    setSavedFeedback(false);

    const cleanWord = searchWord.trim().toLowerCase();

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          let phoneticText = entry.phonetic || '';
          if (!phoneticText && entry.phonetics && entry.phonetics.length > 0) {
            const foundPhonetic = entry.phonetics.find((p: any) => p.text);
            if (foundPhonetic) phoneticText = foundPhonetic.text;
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

          setResult({
            word: entry.word,
            phonetic: phoneticText,
            definition: defText,
            partOfSpeech: posText,
          });
          setLoading(false);
          return;
        }
      }

      setErrorMsg('Word not found. Please try another word.');
    } catch {
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = () => {
    if (result && !isWordSaved(result.word)) {
      saveWord(result);
      setSavedFeedback(true);
    }
  };

  const handleGenerateShareCard = () => {
    setShowShareCard(true);
    setShareFeedback(null);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const shareMsg = `EasyReads Word of the Day:\n\nâœ¨ ${result.word.toUpperCase()} ${result.phonetic || ''}\n(${result.partOfSpeech}) â€” ${result.definition}\n\nJoin me in building a mindful reading habit.`;
      const shareResult = await Share.share({ message: shareMsg, title: `Word Share: ${result.word}` });
      if (shareResult.action === Share.sharedAction) {
        analytics.logEvent(EVENTS.share_word, { word: result.word.slice(0, 40) });
        setShareFeedback('Card shared successfully!');
      }
    } catch (error) {
      setShareFeedback('Could not trigger share sheet.');
    }
  };

  useAndroidBack(() => { if (visible) handleClose(); }, visible);

  const handleClose = () => {
    setSearchWord('');
    setResult(null);
    setErrorMsg(null);
    setShowShareCard(false);
    setShareFeedback(null);
    setSavedFeedback(false);

    onClose();
  };

  const wordAlreadySaved = result ? isWordSaved(result.word) : false;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      {/* Animated backdrop */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={handleClose} />
      </Animated.View>

      {/* Animated Sheet */}
      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: panY }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} {...panResponder.panHandlers} />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="library-outline" size={20} color={COLORS.accent} style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Vocabulary</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <WordOfTheDay />
            {vocabNotebook.length === 0 ? (
              <View style={styles.emptyNotebook}>
                <Ionicons name="bookmark-outline" size={44} color={COLORS.border} />
                <Text style={styles.emptyNotebookTitle}>Your notebook is empty</Text>
                <Text style={styles.emptyNotebookDesc}>
                  Add words to your notebook to see them here.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.notebookHeader}>
                  {vocabNotebook.length} saved word{vocabNotebook.length !== 1 ? 's' : ''}
                </Text>
                {vocabNotebook.map((entry, idx) => (
                  <View key={`${entry.word}-${idx}`} style={styles.notebookCard}>
                    <View style={styles.notebookCardHeader}>
                      <Text style={styles.notebookWord}>{entry.word}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.posBadge}>
                          <Text style={styles.posText}>{entry.partOfSpeech}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => confirmRemove(entry.word)}
                          hitSlop={10}
                          style={styles.removeBtn}
                          accessibilityLabel={`Remove ${entry.word}`}
                        >
                          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {entry.phonetic && (
                      <Text style={styles.notebookPhonetic}>{entry.phonetic}</Text>
                    )}
                    <Text style={styles.notebookDefinition}>{entry.definition}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: SPACING.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.accent,
  },
  tabIcon: {
    marginRight: 5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  notebookBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    paddingHorizontal: 3,
  },
  notebookBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl + 20 : SPACING.xl,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  searchButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  resultHeaderLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  wordTitle: {
    fontSize: 20,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'lowercase',
  },
  phoneticText: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  posBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  removeBtn: {
    padding: 4,
    borderRadius: 6,
  },
  posText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  definitionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginVertical: SPACING.sm,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  saveWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  saveWordBtnSaved: {
    borderColor: 'rgba(74, 124, 89, 0.3)',
    backgroundColor: 'rgba(74, 124, 89, 0.06)',
  },
  actionIcon: {
    marginRight: 5,
  },
  saveWordBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  saveWordBtnTextSaved: {
    color: COLORS.accent,
  },
  generateCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  generateCardBtnText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  // Share Card
  shareCardContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  shareCanvas: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: COLORS.text,
    borderRadius: 12,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  canvasCornerOrnamentTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(197, 168, 128, 0.25)',
  },
  canvasCornerOrnamentBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(197, 168, 128, 0.25)',
  },
  canvasWatermark: {
    color: 'rgba(255, 255, 255, 0.12)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  canvasBody: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: -12,
    left: 0,
  },
  canvasWord: {
    color: COLORS.background,
    fontSize: 22,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    textAlign: 'center',
  },
  canvasPhonetic: {
    color: 'rgba(250, 248, 245, 0.6)',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  canvasPos: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  canvasDefinition: {
    color: COLORS.background,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  canvasFooter: {
    color: 'rgba(250, 248, 245, 0.4)',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  shareActions: {
    width: '100%',
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  shareActionBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  shareFeedbackText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  // Notebook Tab
  emptyNotebook: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyNotebookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyNotebookDesc: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  notebookHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  notebookCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notebookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notebookWord: {
    fontSize: 17,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  notebookPhonetic: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginBottom: SPACING.xs,
  },
  notebookDefinition: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
});



