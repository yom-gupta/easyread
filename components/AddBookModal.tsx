import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'search' | 'confirm' | 'manual';

export const AddBookModal: React.FC<AddBookModalProps> = ({ visible, onClose }) => {
  const { addBook } = useReading();

  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ title?: string; author?: string; pages?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSearchLoading(false);
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCoverUrl(undefined);
      setErrors({});
      setSubmitted(false);
    }
  }, [visible]);

  const handleOnlineSearch = async () => {
    Keyboard.dismiss();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=6`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.docs) setSearchResults(data.docs);
      }
    } catch (e) {
      console.log('OpenLibrary Search failed:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectBook = (item: any) => {
    setTitle(item.title || '');
    setAuthor(item.author_name ? item.author_name.join(', ') : 'Unknown Author');
    const pages = item.number_of_pages_median || item.number_of_pages || '';
    setTotalPages(pages ? String(pages) : '');
    setCoverUrl(item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : undefined);
    setSearchResults([]);
    setSearchQuery('');
    setErrors({});
    setStep('confirm');
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
      setErrors(validationErrors);
      return;
    }
    addBook(title.trim(), author.trim(), parseInt(totalPages, 10), coverUrl);
    setSubmitted(true);
    setTimeout(onClose, 700);
  };

  const goToManual = () => {
    setTitle('');
    setAuthor('');
    setTotalPages('');
    setCoverUrl(undefined);
    setErrors({});
    setStep('manual');
  };

  const renderSearchStep = () => (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Ionicons name="search" size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.heroTitle}>Find Your Book</Text>
        <Text style={styles.heroSub}>Search millions of titles from Open Library</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Title, author, or ISBN..."
          placeholderTextColor={COLORS.mutedText}
          onSubmitEditing={handleOnlineSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleOnlineSearch}>
          {searchLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="search" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsLabel}>Select a book to confirm</Text>
          {searchResults.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.searchResultItem, index === searchResults.length - 1 && styles.lastResult]}
              onPress={() => handleSelectBook(item)}
              activeOpacity={0.7}
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
                <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.searchResultMeta} numberOfLines={1}>
                  {item.author_name ? item.author_name.join(', ') : 'Unknown'}
                  {item.number_of_pages_median ? ` · ${item.number_of_pages_median} pg` : ''}
                </Text>
              </View>
              <View style={styles.selectBadge}>
                <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!searchLoading && searchResults.length === 0 && searchQuery.length > 0 && (
        <View style={styles.noResults}>
          <Ionicons name="book-outline" size={32} color={COLORS.border} />
          <Text style={styles.noResultsText}>No results found</Text>
        </View>
      )}

      <TouchableOpacity style={styles.manualBtn} onPress={goToManual} activeOpacity={0.8}>
        <Ionicons name="create-outline" size={18} color={COLORS.accent} />
        <Text style={styles.manualBtnText}>Can't find it? Add manually</Text>
      </TouchableOpacity>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('search')}>
        <Ionicons name="arrow-back" size={18} color={COLORS.accent} />
        <Text style={styles.backBtnText}>Back to search</Text>
      </TouchableOpacity>

      <View style={styles.confirmHero}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.confirmCover} />
        ) : (
          <View style={styles.confirmCoverPlaceholder}>
            <Ionicons name="book" size={40} color={COLORS.accent} />
          </View>
        )}
        <Text style={styles.confirmTitle}>{title}</Text>
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
          {errors.pages && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
              <Text style={styles.errorText}>{errors.pages}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addSubmitBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Ionicons name="library" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add to My Shelf</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderManualStep = () => (
    <>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('search')}>
        <Ionicons name="arrow-back" size={18} color={COLORS.accent} />
        <Text style={styles.backBtnText}>Back to search</Text>
      </TouchableOpacity>

      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Ionicons name="create" size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.heroTitle}>Add Manually</Text>
        <Text style={styles.heroSub}>Fill in your book details below</Text>
      </View>

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
        {errors.title && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text style={styles.errorText}>{errors.title}</Text>
          </View>
        )}
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
        {errors.author && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text style={styles.errorText}>{errors.author}</Text>
          </View>
        )}
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
        {errors.pages && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text style={styles.errorText}>{errors.pages}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.addSubmitBtn} onPress={handleAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Start Reading</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="library-outline" size={20} color={COLORS.accent} />
              <Text style={styles.headerTitle}>Add to Library</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.stepIndicator}>
            {(['search', 'confirm', 'manual'] as Step[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  (step === s || (step === 'confirm' && s === 'search') || (step === 'manual' && s === 'search')) &&
                    styles.stepDotActive,
                ]}
              />
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
              <>
                {step === 'search' && renderSearchStep()}
                {step === 'confirm' && renderConfirmStep()}
                {step === 'manual' && renderManualStep()}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  closeButton: { padding: SPACING.xs },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: SPACING.sm,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  stepDotActive: { backgroundColor: COLORS.accent },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl + 24 : SPACING.xl,
  },
  heroSection: { alignItems: 'center', marginBottom: SPACING.lg },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(74,124,89,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif },
  heroSub: { fontSize: 13, color: COLORS.mutedText, marginTop: 4, textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  searchResultCover: { width: 40, height: 56, borderRadius: 4, backgroundColor: '#E2E8F0' },
  searchResultPlaceholder: {
    width: 40,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInfo: { flex: 1 },
  searchResultTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  searchResultMeta: { fontSize: 12, color: COLORS.mutedText, marginTop: 2 },
  selectBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74,124,89,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: { alignItems: 'center', paddingVertical: SPACING.lg },
  noResultsText: { fontSize: 14, color: COLORS.mutedText, marginTop: SPACING.sm },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(74,124,89,0.04)',
  },
  manualBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  confirmHero: { alignItems: 'center', marginBottom: SPACING.lg },
  confirmCover: {
    width: 100,
    height: 140,
    borderRadius: 8,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmCoverPlaceholder: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#E6EBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  confirmAuthor: { fontSize: 14, color: COLORS.mutedText, marginTop: 4 },
  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  confirmCardSub: { fontSize: 12, color: COLORS.mutedText, marginTop: 2, marginBottom: SPACING.md },
  fieldGroup: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  pagesInputRow: { flexDirection: 'row', alignItems: 'center' },
  pagesInputLarge: { flex: 1, marginRight: SPACING.sm },
  pagesSuffix: { fontSize: 14, color: COLORS.mutedText, fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorText: { fontSize: 12, color: COLORS.danger, marginLeft: 4 },
  addSubmitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    marginTop: SPACING.sm,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  successContainer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  successIcon: { marginBottom: SPACING.md },
  successText: { fontSize: 22, fontFamily: FONTS.serif, fontWeight: '700', color: COLORS.text },
  successSubtext: { fontSize: 14, color: COLORS.mutedText, marginTop: SPACING.xs, textAlign: 'center' },
});
