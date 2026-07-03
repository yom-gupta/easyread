import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { getAchievementById } from '../utils/achievementHelpers';

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievementId: string | null;
  unlockedAt?: string;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  achievementId,
  unlockedAt,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!achievementId) return null;

  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  const handleShare = async () => {
    try {
      const message = `🎉 I just unlocked "${achievement.name}" on EasyReads!\n\n${achievement.emoji} ${achievement.description}\n\n+${achievement.xpReward} XP earned!`;
      
      await Share.share({
        message,
        title: `Achievement Unlocked: ${achievement.name}`,
      });
    } catch {
      // Share error — ignore
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.mutedText} />
          </TouchableOpacity>

          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{achievement.emoji}</Text>
          </View>

          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>

          <View style={styles.xpBadge}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{achievement.category}</Text>
          </View>

          <Text style={styles.unlockedText}>Unlocked {formatDate(unlockedAt)}</Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={18} color={COLORS.white} />
            <Text style={styles.shareButtonText}>Share Achievement</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  centerContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
    zIndex: 1,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emoji: {
    fontSize: 56,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  achievementDescription: {
    fontSize: 15,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: SPACING.sm,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  categoryBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unlockedText: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
