import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading, Book } from '../context/ReadingContext';

interface QuickSwitchBookModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const QuickSwitchBookModal: React.FC<QuickSwitchBookModalProps> = ({ visible, onClose }) => {
  const { books, currentBook, setCurrentBook } = useReading();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelectBook = (bookId: string) => {
    setCurrentBook(bookId);
    onClose();
  };

  const activeBooks = books.filter(b => b.status === 'reading');

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handle} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Switch Active Book</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeBooks.length === 0 ? (
              <Text style={styles.emptyText}>No other active books available.</Text>
            ) : (
              activeBooks.map((book) => {
                const isSelected = book.bookId === currentBook?.bookId;
                const pct = Math.round((book.pagesRead / book.totalPages) * 100);
                
                return (
                  <TouchableOpacity
                    key={book.bookId}
                    style={[styles.bookItem, isSelected && styles.bookItemSelected]}
                    onPress={() => handleSelectBook(book.bookId)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200' }}
                      style={styles.bookCover}
                    />
                    <View style={styles.bookInfo}>
                      <Text style={[styles.bookTitle, isSelected && styles.bookTitleSelected]}>
                        {book.title}
                      </Text>
                      <Text style={styles.bookAuthor}>by {book.author}</Text>
                      <View style={styles.progressRow}>
                        <View style={styles.miniProgressBarBg}>
                          <View style={[styles.miniProgressBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{pct}% read</Text>
                      </View>
                    </View>
                    
                    {isSelected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
                    )}
                  </TouchableOpacity>
                );
              })
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
    maxHeight: '70%',
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.mutedText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookCover: {
    width: 44,
    height: 60,
    borderRadius: 6,
    marginRight: SPACING.md,
    backgroundColor: COLORS.border,
  },
  bookItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74, 124, 89, 0.03)',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookTitleSelected: {
    color: COLORS.accent,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  miniProgressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  checkBadge: {
    marginLeft: SPACING.sm,
  },
});
