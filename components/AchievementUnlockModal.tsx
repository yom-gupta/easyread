import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { getAchievementById } from '../utils/achievementHelpers';
import { PendingAchievement } from '../context/ReadingContext';

const { width } = Dimensions.get('window');

interface AchievementUnlockModalProps {
  pending: PendingAchievement[];
  onDismiss: () => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  pending,
  onDismiss,
}) => {
  const current = pending[0];
  const achievement = current ? getAchievementById(current.id) : null;
  const isPehlaKitaab = current?.isPehlaKitaab;

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    if (current && achievement) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      emojiAnim.setValue(0);
      shineAnim.setValue(-width);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 55,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(emojiAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 35,
            friction: 5,
          }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(shineAnim, {
            toValue: width * 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto-dismiss after 6s
      const timer = setTimeout(onDismiss, 6000);
      return () => clearTimeout(timer);
    }
  }, [current?.id]);

  if (!current || !achievement) return null;

  if (isPehlaKitaab) {
    // ── Special Pehla Kitaab Certificate ──────────────────────
    return (
      <Modal
        transparent
        visible={true}
        animationType="none"
        statusBarTranslucent
        onRequestClose={onDismiss}
      >
        <LottieView
          source={require('../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onDismiss}
          />

          <Animated.View
            style={[styles.certificate, { transform: [{ scale: scaleAnim }] }]}
          >
            {/* Gold border ornaments */}
            <View style={styles.certCornerTL} />
            <View style={styles.certCornerTR} />
            <View style={styles.certCornerBL} />
            <View style={styles.certCornerBR} />

            {/* Shine effect */}
            <Animated.View
              pointerEvents="none"
              style={[styles.shine, { transform: [{ translateX: shineAnim }] }]}
            />

            <Text style={styles.certTop}>🥇</Text>
            <Text style={styles.certTitle}>Pehla Kitaab!</Text>
            <Text style={styles.certHindi}>पहला किताब</Text>
            <View style={styles.certDivider} />
            <Text style={styles.certLabel}>You finished your first book!</Text>
            {current.bookTitle && (
              <Text style={styles.certBookTitle}>"{current.bookTitle}"</Text>
            )}
            <Text style={styles.certDate}>
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <View style={styles.certDivider} />
            <Text style={styles.certQuote}>
              "The more that you read, the more things you will know."
            </Text>
            <Text style={styles.certQuoteAuthor}>— Dr. Seuss</Text>

            <View style={styles.xpBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.xpBadgeText}>+200 XP</Text>
            </View>

            <TouchableOpacity
              style={styles.certBtn}
              onPress={onDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.certBtnText}>Frame This! 🎉</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // ── Regular Achievement Unlock ─────────────────────────────────
  const categoryColors: Record<string, string> = {
    Reading: '#4A7C59',
    Streak: '#F97316',
    Vocab: '#8B5CF6',
    Lifestyle: '#EC4899',
    XP: '#F59E0B',
    Goals: '#3B82F6',
    Social: '#06B6D4',
    PerBook: '#10B981',
  };

  const catColor = categoryColors[achievement.category] || COLORS.accent;

  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <LottieView
        source={require('../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: catColor }]} />

          {/* "Achievement Unlocked" pill */}
          <View style={[styles.unlockedPill, { backgroundColor: catColor + '18' }]}>
            <Ionicons name="trophy" size={10} color={catColor} />
            <Text style={[styles.unlockedPillText, { color: catColor }]}>
              Achievement Unlocked!
            </Text>
          </View>

          {/* Emoji */}
          <Animated.Text
            style={[styles.achEmoji, { transform: [{ scale: emojiAnim }] }]}
          >
            {achievement.emoji}
          </Animated.Text>

          {/* Name */}
          <Text style={styles.achName}>{achievement.name}</Text>

          {/* Description */}
          <Text style={styles.achDesc}>{achievement.description}</Text>

          {/* XP reward */}
          <View style={[styles.xpBadge, { backgroundColor: '#FEF3C7', marginTop: SPACING.sm }]}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.xpBadgeText}>+{achievement.xpReward} XP</Text>
          </View>

          {/* Queue info */}
          {pending.length > 1 && (
            <Text style={styles.queueInfo}>+{pending.length - 1} more achievement{pending.length > 2 ? 's' : ''}</Text>
          )}

          {/* Dismiss */}
          <TouchableOpacity
            style={[styles.dismissBtn, { backgroundColor: catColor }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.dismissBtnText}>
              {pending.length > 1 ? `Next (${pending.length - 1} left)` : 'Awesome! 🎉'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 30, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  // Regular achievement card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  accentBar: {
    width: '100%',
    height: 5,
    marginBottom: SPACING.md,
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  unlockedPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  achEmoji: {
    fontSize: 60,
    marginVertical: SPACING.sm,
  },
  achName: {
    fontSize: 22,
    fontFamily: FONTS.serif,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: SPACING.md,
  },
  achDesc: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.lg,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: SPACING.md,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  queueInfo: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginBottom: SPACING.sm,
  },
  dismissBtn: {
    borderRadius: 14,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 13,
    marginHorizontal: SPACING.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },

  // Pehla Kitaab certificate
  certificate: {
    backgroundColor: '#FFFBF0',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: COLORS.gold,
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  certCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.gold,
    borderRadius: 3,
  },
  certCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.gold,
    borderRadius: 3,
  },
  certCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.gold,
    borderRadius: 3,
  },
  certCornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.gold,
    borderRadius: 3,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },
  certTop: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  certTitle: {
    fontSize: 28,
    fontFamily: FONTS.serif,
    fontWeight: '800',
    color: '#92400E',
    textAlign: 'center',
  },
  certHindi: {
    fontSize: 14,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  certDivider: {
    width: '70%',
    height: 1.5,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.sm,
    opacity: 0.5,
  },
  certLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginBottom: 4,
  },
  certBookTitle: {
    fontSize: 17,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  certDate: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginBottom: SPACING.sm,
  },
  certQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  certQuoteAuthor: {
    fontSize: 10,
    color: COLORS.gold,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: SPACING.md,
  },
  certBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 13,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  certBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
