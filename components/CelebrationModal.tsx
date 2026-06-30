import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface CelebrationModalProps {
  visible: boolean;
  onDismiss: () => void;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
}

const { width } = Dimensions.get('window');

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onDismiss,
  userName,
  bookTitle,
  bookAuthor,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.certificateContainer}>
          {/* Decorative Corner Ornaments */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <View style={styles.contentContainer}>
            {/* Cultural / Mindful Icon Motif */}
            <View style={styles.iconContainer}>
              <Ionicons name="rose" size={42} color={COLORS.gold} />
            </View>

            <Text style={styles.title}>PEHLA KITAAB</Text>
            <Text style={styles.subtitle}>First Book Completion Certificate</Text>

            <View style={styles.divider} />

            <Text style={styles.congratsText}>
              This is to honor and celebrate
            </Text>
            
            <Text style={styles.userName}>{userName}</Text>

            <Text style={styles.descriptionText}>
              for completing their very first book on EasyReads:
            </Text>

            <Text style={styles.bookTitle}>
              "{bookTitle}"
            </Text>
            <Text style={styles.bookAuthor}>
              by {bookAuthor}
            </Text>

            <View style={styles.dividerSmall} />

            <Text style={styles.blessingText}>
              "A reader lives a thousand lives before he dies. You have just completed your first journey. Keep reading without rush, at your own calm pace."
            </Text>

            <TouchableOpacity style={styles.button} onPress={onDismiss}>
              <Text style={styles.buttonText}>Continue Reading</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 46, 64, 0.85)', // Deep Ink Blue with high opacity
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  certificateContainer: {
    width: '100%',
    maxWidth: width - 40,
    backgroundColor: COLORS.background, // Warm paper cream
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 16,
    padding: SPACING.xl,
    position: 'relative',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.4)', // Outer certificate boundary
    borderRadius: 8,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 26,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.lg,
    opacity: 0.6,
  },
  congratsText: {
    fontSize: 14,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  userName: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    marginVertical: SPACING.sm,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  bookTitle: {
    fontSize: 18,
    color: COLORS.accent, // Sage Green
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  dividerSmall: {
    width: '25%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  blessingText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.mutedText,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.accent, // Sage Green
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  // Corner Ornament Styles
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.gold,
  },
  topLeft: {
    top: SPACING.sm,
    left: SPACING.sm,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: SPACING.sm,
    right: SPACING.sm,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: SPACING.sm,
    left: SPACING.sm,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: SPACING.sm,
    right: SPACING.sm,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
