import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';

interface StreakDetailModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FREEZE_TOKEN_MAX = 2;

export const StreakDetailModal: React.FC<StreakDetailModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useReading();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const handleShare = async () => {
    try {
      const message = `ðŸ”¥ ${user.currentStreak} Day Reading Streak! ðŸ”¥\n\n` +
        `I've been reading consistently for ${user.currentStreak} days straight on EasyReads!\n\n` +
        `My longest streak: ${user.longestStreak} days ðŸ“š\n\n` +
        `Join me in building a reading habit! ðŸ“–`;

      await Share.share({
        message,
        title: 'My Reading Streak',
      });
    } catch {
      // Share error â€” ignore
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
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
            <Text style={styles.headerTitle}>Streak Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current Streak Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.flameContainer}>
                <Ionicons name="flame" size={64} color="#F97316" />
              </View>
              <Text style={styles.streakNumber}>{user.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakSubtext}>
                Keep reading daily to maintain your streak!
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={28} color="#EAB308" />
                <Text style={styles.statValue}>{user.longestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color={COLORS.accent} />
                <Text style={styles.statValue}>{user.currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
            </View>

            {/* Streak Freeze Section */}
            <View style={styles.freezeCard}>
              <View style={styles.freezeHeader}>
                <Ionicons name="snow" size={20} color="#60A5FA" />
                <Text style={styles.freezeTitle}>Streak Freeze Tokens</Text>
              </View>
              <Text style={styles.freezeDescription}>
                Protect your streak when life gets busy. Tokens are earned every 2 days
                of consecutive reading and when you level up.
              </Text>

              <View style={styles.freezeTokensRow}>
                {Array.from({ length: FREEZE_TOKEN_MAX }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.freezeTokenLarge,
                      i < user.streakFreezeAvailable
                        ? styles.freezeTokenActive
                        : styles.freezeTokenInactive,
                    ]}
                  >
                    <Ionicons
                      name="snow"
                      size={32}
                      color={
                        i < user.streakFreezeAvailable ? '#60A5FA' : '#CBD5E1'
                      }
                    />
                  </View>
                ))}
              </View>

              <View style={styles.freezeCountBadge}>
                <Text style={styles.freezeCountText}>
                  {user.streakFreezeAvailable} / {FREEZE_TOKEN_MAX} Available
                </Text>
              </View>
            </View>

            {/* How Streaks Work */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How Streaks Work</Text>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                <Text style={styles.infoText}>
                  Log reading every day to maintain your streak
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="snow" size={18} color="#60A5FA" />
                <Text style={styles.infoText}>
                  Freeze tokens auto-protect your streak if you miss a day
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="trending-up" size={18} color="#EAB308" />
                <Text style={styles.infoText}>
                  Reading 3+ days per week also maintains your streak
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="gift" size={18} color="#F472B6" />
                <Text style={styles.infoText}>
                  Earn tokens every 2 days and when leveling up
                </Text>
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social" size={20} color={COLORS.white} />
              <Text style={styles.shareButtonText}>Share My Streak</Text>
            </TouchableOpacity>
            <View style={{ marginBottom: 50 }} />
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
    paddingBottom: 20,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  flameContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F97316',
    fontFamily: FONTS.serif,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  streakSubtext: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginTop: SPACING.sm,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  freezeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  freezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  freezeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  freezeDescription: {
    fontSize: 13,
    color: COLORS.mutedText,
    lineHeight: 19,
    marginBottom: SPACING.lg,
  },
  freezeTokensRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  freezeTokenLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  freezeTokenActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: '#60A5FA',
  },
  freezeTokenInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  freezeCountBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  freezeCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: FONTS.serif,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});


