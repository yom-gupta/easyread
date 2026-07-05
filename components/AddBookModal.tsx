import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';
import { haptics } from '../utils/haptics';
import { BarcodeScannerView } from './BarcodeScannerView';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
}

// Three input methods surfaced as segmented tabs. All flow into the shared
// "confirm" step.
type Method = 'search' | 'scan' | 'manual';
type StepView = Method | 'confirm';

interface OpenLibraryBook {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  number_of_pages?: number;
  cover_i?: number;
  key?: string;
  isbn?: string[];
}

const METHODS: { id: Method; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'search', label: 'Search', icon: 'search-outline' },
  { id: 'scan',   label: 'Scan',   icon: 'barcode-outline' },
  { id: 'manual', label: 'Manual', icon: 'create-outline' },
];

// ── Skeleton for search results while loading ──────────────
const SkeletonRow: React.FC = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return (
    <Animated.View style={[styles.searchResultItem, { opacity }]}>
      <View style={styles.searchResultPlaceholder} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skelLine} />
        <View style={[styles.skelLine, { width: '60%' }]} />
      </View>
    </Animated.View>
  );
};

export const AddBookModal: React.FC<AddBookModalProps> = ({ visible, onClose }) => {
  const { addBook, books, setCurrentBook } = useReading();

  // Normalize title+author for dup checks (whitespace + case).
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const findDuplicate = (t: string, a: string) => {
    const nt = normalize(t);
    const na = normalize(a);
    return books.find(b => normalize(b.title) === nt && normalize(b.author) === na);
  };

  const [method, setMethod] = useState<Method>('search');
  const [view, setView] = useState<StepView>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  // Scan state
  const [isbnLookupLoading, setIsbnLookupLoading] = useState(false);
  const [isbnError, setIsbnError] = useState<string | null>(null);

  // Book being confirmed / manually entered
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ title?: string; author?: string; pages?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  // Cross-fade between tabs / confirm view
  const viewFade = useRef(new Animated.Value(1)).current;
  const viewSlide = useRef(new Animated.Value(0)).current;

  // Segmented tab indicator (slides left/right)
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const [tabTrackWidth, setTabTrackWidth] = useState(0);

  useEffect(() => {
    Animated.spring(tabIndicator, {
      toValue: METHODS.findIndex(m => m.id === method),
      useNativeDriver: false,
      friction: 8,
      tension: 90,
    }).start();
  }, [method, tabIndicator]);

  // Reset on open, focus search after slide-in finishes (fixes the jiggle).
  useEffect(() => {
    if (visible) {
      setMethod('search');
      setView('search');
      setSearchQuery('');
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      setIsbnLookupLoading(false);
      setIsbnError(null);
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCoverUrl(undefined);
      setErrors({});
      setSubmitted(false);
      viewFade.setValue(1);
      viewSlide.setValue(0);

      focusTimerRef.current = setTimeout(() => {
        if (method === 'search') searchInputRef.current?.focus();
      }, 380);
    }
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [visible]);

  // Debounced search-as-you-type.
  useEffect(() => {
    if (view !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(q), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, view]);

  const runSearch = async (q: string) => {
    const seq = ++requestSeqRef.current;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&sort=readinglog`,
      );
      if (!response.ok) throw new Error('bad status');
      const data = await response.json();
      if (seq !== requestSeqRef.current) return;

      // Dedupe by title + first author to hide editions.
      const seen = new Set<string>();
      const deduped: OpenLibraryBook[] = [];
      for (const doc of (data?.docs || []) as OpenLibraryBook[]) {
        const key = `${(doc.title || '').toLowerCase()}::${(doc.author_name?.[0] || '').toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(doc);
      }
      setSearchResults(deduped);
    } catch {
      if (seq === requestSeqRef.current) {
        setSearchError('Couldn\'t reach Open Library. Check your connection.');
        setSearchResults([]);
      }
    } finally {
      if (seq === requestSeqRef.current) setSearchLoading(false);
    }
  };

  // ── ISBN scan → OpenLibrary lookup → confirm view ──────────
  const handleIsbnScanned = async (isbn: string) => {
    if (isbnLookupLoading) return;
    setIsbnLookupLoading(true);
    setIsbnError(null);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`);
      const data = await res.json();
      const doc = (data?.docs?.[0]) as OpenLibraryBook | undefined;
      if (!doc || !doc.title) {
        setIsbnError(`No book found for ISBN ${isbn}. Try Search or Manual.`);
        haptics.warning();
        return;
      }
      handleSelectBook(doc);
    } catch {
      setIsbnError('Couldn\'t look up that ISBN. Check your connection.');
    } finally {
      setIsbnLookupLoading(false);
    }
  };

  const transitionToView = (next: StepView, direction: 1 | -1 = 1) => {
    haptics.tapLight();
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(viewFade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(viewSlide, { toValue: -20 * direction, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setView(next);
      viewSlide.setValue(20 * direction);
      Animated.parallel([
        Animated.timing(viewFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(viewSlide, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
      ]).start();
    });
  };

  const pickMethod = (m: Method) => {
    if (m === method && view === m) return;
    haptics.select();
    setMethod(m);
    setIsbnError(null);
    transitionToView(m);
    if (m === 'search') {
      focusTimerRef.current = setTimeout(() => searchInputRef.current?.focus(), 260);
    }
  };

  const handleSelectBook = (item: OpenLibraryBook) => {
    haptics.tapMedium();
    setTitle(item.title || '');
    setAuthor(item.author_name ? item.author_name.slice(0, 2).join(', ') : 'Unknown Author');
    const pages = item.number_of_pages_median || item.number_of_pages || '';
    setTotalPages(pages ? String(pages) : '');
    setCoverUrl(item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : undefined);
    setErrors({});
    transitionToView('confirm');
  };

  const validate = () => {
    const newErrors: { title?: string; author?: string; pages?: string } = {};
    if (!title.trim()) newErrors.title = 'Book title is required.';
    if (!author.trim()) newErrors.author = 'Author name is required.';
    const pages = parseInt(totalPages, 10);
    if (!totalPages.trim() || isNaN(pages)) {
      newErrors.pages = 'Enter a valid number of pages.';
    } else if (pages < 1) {
      newErrors.pages = 'Must have at least 1 page.';
    }
    return newErrors;
  };

  const handleAdd = () => {
    Keyboard.dismiss();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      haptics.warning();
      setErrors(validationErrors);
      return;
    }

    // Dup check — nudge the user to open the existing book instead of adding twice.
    const existing = findDuplicate(title, author);
    if (existing) {
      haptics.warning();
      Alert.alert(
        'Already in your library',
        `"${existing.title}" by ${existing.author} is already on your shelf. Open it instead?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open book',
            onPress: () => {
              setCurrentBook(existing.bookId);
              onClose();
            },
          },
        ],
      );
      return;
    }

    haptics.success();
    addBook(title.trim(), author.trim(), parseInt(totalPages, 10), coverUrl);
    setSubmitted(true);
    setTimeout(onClose, 800);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    searchInputRef.current?.focus();
  };

  // ── VIEWS ──────────────────────────────────────────────────
  const renderSearch = () => (
    <>
      <View style={styles.searchInputWrap}>
        <Ionicons name="search" size={18} color={COLORS.mutedText} style={{ marginRight: 10 }} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Title, author, ISBN…"
          placeholderTextColor={COLORS.mutedText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && !searchLoading ? (
          <TouchableOpacity onPress={clearSearch} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.mutedText} />
          </TouchableOpacity>
        ) : searchLoading ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.clearBtn} />
        ) : null}
      </View>

      {searchQuery.trim().length < 2 && !searchLoading && (
        <View style={styles.hintCard}>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.accent} />
          <Text style={styles.hintText}>
            Try titles like <Text style={styles.hintBold}>Alchemist</Text>, authors like <Text style={styles.hintBold}>Murakami</Text>, or an ISBN.
          </Text>
        </View>
      )}

      {searchLoading && searchResults.length === 0 && (
        <View style={styles.resultsCard}>
          <SkeletonRow /><SkeletonRow /><SkeletonRow />
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsLabel}>
            {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} · tap to add
          </Text>
          {searchResults.map((item, index) => {
            const alreadyAdded = !!findDuplicate(
              item.title || '',
              item.author_name?.slice(0, 2).join(', ') || '',
            );
            return (
              <TouchableOpacity
                key={`${item.key || index}`}
                style={[styles.searchResultItem, index === searchResults.length - 1 && styles.lastResult]}
                onPress={() => handleSelectBook(item)}
                activeOpacity={0.6}
              >
                {item.cover_i ? (
                  <Image
                    source={{ uri: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` }}
                    style={styles.searchResultCover}
                  />
                ) : (
                  <View style={styles.searchResultPlaceholder}>
                    <Ionicons name="book" size={16} color={COLORS.mutedText} />
                  </View>
                )}
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
                  <Text style={styles.searchResultMeta} numberOfLines={1}>
                    {item.author_name?.slice(0, 2).join(', ') || 'Unknown'}
                    {item.first_publish_year ? ` · ${item.first_publish_year}` : ''}
                    {item.number_of_pages_median ? ` · ${item.number_of_pages_median} pg` : ''}
                  </Text>
                  {alreadyAdded && (
                    <View style={styles.alreadyPill}>
                      <Ionicons name="checkmark-circle" size={11} color={COLORS.accent} />
                      <Text style={styles.alreadyPillText}>On your shelf</Text>
                    </View>
                  )}
                </View>
                <View style={styles.selectBadge}>
                  <Ionicons name={alreadyAdded ? 'checkmark' : 'add'} size={16} color={COLORS.accent} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {searchError && (
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={20} color={COLORS.danger} />
          <Text style={styles.errorCardText}>{searchError}</Text>
        </View>
      )}

      {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchError && (
        <View style={styles.noResults}>
          <Ionicons name="book-outline" size={32} color={COLORS.border} />
          <Text style={styles.noResultsTitle}>No results found</Text>
          <Text style={styles.noResultsSub}>Try a different spelling, or scan the barcode.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.md }}>
            <TouchableOpacity style={styles.altBtnSmall} onPress={() => pickMethod('scan')}>
              <Ionicons name="barcode-outline" size={14} color={COLORS.accent} />
              <Text style={styles.altBtnSmallText}>Scan barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.altBtnSmall} onPress={() => pickMethod('manual')}>
              <Ionicons name="create-outline" size={14} color={COLORS.accent} />
              <Text style={styles.altBtnSmallText}>Add manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const renderScan = () => (
    <>
      <BarcodeScannerView
        active={view === 'scan' && !isbnLookupLoading}
        onDetected={handleIsbnScanned}
        onSwitchToManual={() => pickMethod('manual')}
      />
      {isbnLookupLoading && (
        <View style={styles.scanOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.scanOverlayText}>Looking up…</Text>
        </View>
      )}
      {isbnError && (
        <View style={[styles.errorCard, { marginTop: SPACING.md }]}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
          <Text style={styles.errorCardText}>{isbnError}</Text>
        </View>
      )}
    </>
  );

  const renderManual = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Book Title</Text>
        <TextInput
          style={[styles.input, errors.title ? styles.inputError : null]}
          value={title}
          onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: undefined })); }}
          placeholder="e.g. The Alchemist"
          placeholderTextColor={COLORS.mutedText}
          autoCapitalize="words"
        />
        {errors.title && <FieldError text={errors.title} />}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Author</Text>
        <TextInput
          style={[styles.input, errors.author ? styles.inputError : null]}
          value={author}
          onChangeText={t => { setAuthor(t); setErrors(e => ({ ...e, author: undefined })); }}
          placeholder="e.g. Paulo Coelho"
          placeholderTextColor={COLORS.mutedText}
          autoCapitalize="words"
        />
        {errors.author && <FieldError text={errors.author} />}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Total Pages</Text>
        <View style={styles.pagesInputRow}>
          <TextInput
            style={[styles.input, styles.pagesInputLarge, errors.pages ? styles.inputError : null]}
            value={totalPages}
            onChangeText={t => { setTotalPages(t); setErrors(e => ({ ...e, pages: undefined })); }}
            placeholder="e.g. 320"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="number-pad"
          />
          <Text style={styles.pagesSuffix}>pages</Text>
        </View>
        {errors.pages && <FieldError text={errors.pages} />}
      </View>

      <TouchableOpacity style={styles.addSubmitBtn} onPress={handleAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Start Reading</Text>
      </TouchableOpacity>
    </>
  );

  const renderConfirm = () => (
    <>
      <TouchableOpacity style={styles.backBtn} onPress={() => transitionToView(method, -1)}>
        <Ionicons name="arrow-back" size={18} color={COLORS.accent} />
        <Text style={styles.backBtnText}>Back to {method}</Text>
      </TouchableOpacity>

      <View style={styles.confirmHero}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.confirmCover} />
        ) : (
          <View style={styles.confirmCoverPlaceholder}>
            <Ionicons name="book" size={40} color={COLORS.accent} />
          </View>
        )}
        <Text style={styles.confirmTitle} numberOfLines={3}>{title}</Text>
        <Text style={styles.confirmAuthor}>by {author}</Text>
      </View>

      <View style={styles.confirmCard}>
        <Text style={styles.confirmCardTitle}>Confirm details</Text>
        <Text style={styles.confirmCardSub}>Check the page count before adding to your shelf</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Total Pages</Text>
          <View style={styles.pagesInputRow}>
            <TextInput
              style={[styles.input, styles.pagesInputLarge, errors.pages ? styles.inputError : null]}
              value={totalPages}
              onChangeText={t => { setTotalPages(t); setErrors(e => ({ ...e, pages: undefined })); }}
              placeholder="e.g. 320"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="number-pad"
            />
            <Text style={styles.pagesSuffix}>pages</Text>
          </View>
          {errors.pages && <FieldError text={errors.pages} />}
        </View>

        <TouchableOpacity style={styles.addSubmitBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Ionicons name="library" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add to My Shelf</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="library-outline" size={20} color={COLORS.accent} />
              <Text style={styles.headerTitle}>Add a book</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Segmented tabs — hidden when confirming so focus stays on the book */}
          {view !== 'confirm' && (
            <View
              style={styles.tabTrack}
              onLayout={e => setTabTrackWidth(e.nativeEvent.layout.width)}
            >
              {tabTrackWidth > 0 && (
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    {
                      width: (tabTrackWidth - 8) / METHODS.length,
                      transform: [{
                        translateX: tabIndicator.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [0, (tabTrackWidth - 8) / METHODS.length, ((tabTrackWidth - 8) / METHODS.length) * 2],
                        }),
                      }],
                    },
                  ]}
                />
              )}
              {METHODS.map(m => {
                const selected = method === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => pickMethod(m.id)}
                    style={styles.tabItem}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons name={m.icon} size={15} color={selected ? COLORS.white : COLORS.mutedText} />
                    <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            // Scan view fills the sheet — disable scroll to keep camera stable.
            scrollEnabled={view !== 'scan'}
          >
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={COLORS.accent} />
                </View>
                <Text style={styles.successText}>Added to Your Shelf!</Text>
                <Text style={styles.successSubtext}>Happy reading, one page at a time.</Text>
              </View>
            ) : (
              <Animated.View
                style={{
                  opacity: viewFade,
                  transform: [{ translateX: viewSlide }],
                  flex: view === 'scan' ? 1 : undefined,
                }}
              >
                {view === 'search'  && renderSearch()}
                {view === 'scan'    && renderScan()}
                {view === 'manual'  && renderManual()}
                {view === 'confirm' && renderConfirm()}
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const FieldError: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.errorRow}>
    <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
    <Text style={styles.errorText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  dismissOverlay: { flex: 1 },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  closeButton: { padding: SPACING.xs },

  // Segmented tabs
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F0',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4, bottom: 4, left: 4,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: COLORS.mutedText },
  tabLabelSelected: { color: COLORS.white },

  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl + 24 : SPACING.xl,
    flexGrow: 1,
  },

  // Search
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    height: 52,
    marginBottom: SPACING.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 },
  clearBtn: { padding: 4, marginLeft: 4 },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(74,124,89,0.06)',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  hintText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  hintBold: { fontWeight: '700', color: COLORS.accent },
  resultsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  resultsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: SPACING.sm,
    paddingBottom: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  lastResult: { borderBottomWidth: 0 },
  searchResultCover: { width: 44, height: 62, borderRadius: 5, backgroundColor: '#E2E8F0' },
  searchResultPlaceholder: {
    width: 44, height: 62, borderRadius: 5,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center', alignItems: 'center',
  },
  searchResultInfo: { flex: 1 },
  searchResultTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  searchResultMeta: { fontSize: 12, color: COLORS.mutedText, marginTop: 2 },
  selectBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(74,124,89,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  alreadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(74,124,89,0.08)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alreadyPillText: { fontSize: 10, color: COLORS.accent, fontWeight: '700' },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: '#E6EBF0', width: '85%' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    marginBottom: SPACING.md,
  },
  errorCardText: { flex: 1, fontSize: 13, color: COLORS.danger },
  noResults: { alignItems: 'center', paddingVertical: SPACING.lg, marginBottom: SPACING.md },
  noResultsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  noResultsSub: { fontSize: 12, color: COLORS.mutedText, marginTop: 4, textAlign: 'center' },
  altBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,124,89,0.04)',
  },
  altBtnSmallText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },

  // Scan
  scanOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: 16,
  },
  scanOverlayText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  // Confirm & manual
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent, textTransform: 'capitalize' },
  confirmHero: { alignItems: 'center', marginBottom: SPACING.lg },
  confirmCover: {
    width: 108, height: 152, borderRadius: 8, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  confirmCoverPlaceholder: {
    width: 108, height: 152, borderRadius: 8,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif,
    textAlign: 'center', paddingHorizontal: SPACING.md,
  },
  confirmAuthor: { fontSize: 14, color: COLORS.mutedText, marginTop: 4 },
  confirmCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  confirmCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  confirmCardSub: { fontSize: 12, color: COLORS.mutedText, marginTop: 2, marginBottom: SPACING.md },
  fieldGroup: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: SPACING.md, height: 48, fontSize: 15, color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  pagesInputRow: { flexDirection: 'row', alignItems: 'center' },
  pagesInputLarge: { flex: 1, marginRight: SPACING.sm },
  pagesSuffix: { fontSize: 14, color: COLORS.mutedText, fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorText: { fontSize: 12, color: COLORS.danger, marginLeft: 4 },
  addSubmitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, height: 52, borderRadius: 14, backgroundColor: COLORS.accent,
    marginTop: SPACING.sm,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  successContainer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  successIcon: { marginBottom: SPACING.md },
  successText: { fontSize: 22, fontFamily: FONTS.serif, fontWeight: '700', color: COLORS.text },
  successSubtext: { fontSize: 14, color: COLORS.mutedText, marginTop: SPACING.xs, textAlign: 'center' },
});
