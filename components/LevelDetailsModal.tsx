import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { LEVEL_TABLE, getLevelFromXP, getLevelProgress, getXPToNextLevel } from '../utils/xpHelpers';
import { useReading } from '../context/ReadingContext';

interface LevelDetailsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const LevelDetailsModal: React.FC<LevelDetailsModalProps> = ({ visible, onClose }) => {
  const { user } = useReading();
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      panY.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
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

  const currentLevel = getLevelFromXP(user.totalXP);
  const levelProgress = getLevelProgress(user.totalXP);
  const xpToNext = getXPToNextLevel(user.totalXP);
  const isMaxLevel = currentLevel.level === 10;

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
          { transform: [{ translateY: panY }] },
        ]}
      >
        <View style={styles.handle} {...panResponder.panHandlers} />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Level Progression</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Current Level Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: currentLevel.color + '10', borderColor: currentLevel.color + '40' }]}>
              <Text style={styles.heroEmoji}>{currentLevel.emoji}</Text>
              <Text style={[styles.heroLevel, { color: currentLevel.color }]}>Level {currentLevel.level}</Text>
              <Text style={styles.heroName}>{currentLevel.name}</Text>
              <Text style={styles.heroHindi}>{currentLevel.hindiName}</Text>
              <Text style={styles.heroRoast}>{currentLevel.roastLine}</Text>

              {/* XP Progress */}
              <View style={styles.xpSection}>
                <View style={styles.xpLabels}>
                  <Text style={styles.xpLabelLeft}>{user.totalXP} XP</Text>
                  {isMaxLevel ? (
                    <Text style={styles.xpLabelRight}>MAX LEVEL 👑</Text>
                  ) : (
                    <Text style={styles.xpLabelRight}>{xpToNext} XP to next level</Text>
                  )}
                </View>
                <View style={styles.xpBarBg}>
                  <View
                    style={[
                      styles.xpBarFill,
                      {
                        backgroundColor: currentLevel.color,
                        width: `${levelProgress * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* XP Rewards Table */}
            <Text style={styles.sectionTitle}>XP Rewards</Text>
            <View style={styles.rewardsCard}>
              <XPRow icon="book" label="Per Page Read" xp={2} color="#8B5CF6" />
              <XPRow icon="bookmark" label="Word Added to Vault" xp={5} color="#EC4899" />
              <XPRow icon="checkmark-circle" label="Quiz Pass" xp={15} color="#10B981" />
              <XPRow icon="star" label="Word Mastered" xp={50} color="#F59E0B" />
              <XPRow icon="flag" label="Daily Goal Hit" xp={20} color={COLORS.accent} />
              <XPRow icon="book-outline" label="Book Completed" xp={100} color="#3B82F6" />
              <XPRow icon="trophy" label="Achievement Unlocked" xp={10} color="#EAB308" />
              <XPRow icon="flame" label="7-Day Streak" xp={50} color="#F97316" />
              <XPRow icon="flame" label="14-Day Streak" xp={75} color="#DC2626" />
              <XPRow icon="flame" label="30-Day Streak" xp={150} color="#991B1B" />
              <XPRow icon="share-social" label="Vocab Card Shared" xp={5} color="#06B6D4" />
            </View>

            {/* Level Journey Map */}
            <Text style={styles.sectionTitle}>All Levels</Text>
            {LEVEL_TABLE.map((lvl) => {
              const isEarned = user.level >= lvl.level;
              const isCurrent = user.level === lvl.level;
              return (
                <View
                  key={lvl.level}
                  style={[
                    styles.levelCard,
                    isEarned && { borderColor: lvl.color + '60', backgroundColor: lvl.color + '05' },
                    isCurrent && { borderWidth: 2, borderColor: lvl.color },
                  ]}
                >
                  <View style={styles.levelCardLeft}>
                    <Text style={styles.levelCardEmoji}>{lvl.emoji}</Text>
                    <View style={styles.levelCardInfo}>
                      <View style={styles.levelCardHeader}>
                        <Text style={[styles.levelCardLevel, isEarned && { color: lvl.color }]}>
                          Level {lvl.level}
                        </Text>
                        {isCurrent && (
                          <View style={[styles.currentBadge, { backgroundColor: lvl.color }]}>
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.levelCardName, isEarned && { color: lvl.color }]}>
                        {lvl.name}
                      </Text>
                      <Text style={styles.levelCardHindi}>{lvl.hindiName}</Text>
                    </View>
                  </View>
                  <View style={styles.levelCardRight}>
                    <Text style={styles.levelCardXP}>
                      {lvl.maxXP === Infinity ? `${lvl.minXP}+` : `${lvl.minXP}-${lvl.maxXP}`}
                    </Text>
                    <Text style={styles.levelCardXPLabel}>XP</Text>
                  </View>
                </View>
              );
            })}
            <View style={{ marginBottom: 50 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Helper component for XP rows
const XPRow: React.FC<{ icon: string; label: string; xp: number; color: string }> = ({
  icon,
  label,
  xp,
  color,
}) => (
  <View style={styles.xpRow}>
    <View style={styles.xpRowLeft}>
      <View style={[styles.xpIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={styles.xpRowLabel}>{label}</Text>
    </View>
    <View style={styles.xpBadge}>
      <Text style={styles.xpBadgeText}>+{xp} XP</Text>
    </View>
  </View>
);

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

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  heroLevel: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginTop: 4,
  },
  heroHindi: {
    fontSize: 16,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroRoast: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  xpSection: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabelLeft: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  xpLabelRight: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  xpBarBg: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  xpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  xpIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpRowLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  // Level Cards
  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  levelCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  levelCardEmoji: {
    fontSize: 32,
  },
  levelCardInfo: {
    flex: 1,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelCardLevel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  levelCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginTop: 2,
  },
  levelCardHindi: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginTop: 1,
  },
  levelCardRight: {
    alignItems: 'flex-end',
  },
  levelCardXP: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  levelCardXPLabel: {
    fontSize: 9,
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 1,
  },
});
