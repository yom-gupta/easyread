import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';
import { getLevelFromXP, getLevelProgress, getXPToNextLevel, LEVEL_TABLE } from '../utils/xpHelpers';
import {
  GLOBAL_ACHIEVEMENTS,
} from '../utils/achievementHelpers';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { LevelDetailsModal } from '../components/LevelDetailsModal';
import { AchievementDetailModal } from '../components/AchievementDetailModal';
import { StreakDetailModal } from '../components/StreakDetailModal';
import { signOut } from '../services/firebase/authService';

const { width } = Dimensions.get('window');
const pfp = require('../assets/pfp.png');

const FREEZE_TOKEN_MAX = 2;

export const ProfileScreen: React.FC = () => {
  const { user, books, logs, updateGoal, pendingAchievements, dismissPendingAchievement, setAuthUser } = useReading();

  // Modal states
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

  const totalPagesRead = user.totalPagesRead || logs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
  const completedBooks = user.totalBooksFinished || books.filter(b => b.status === 'completed').length;
  const daysLogged = new Set(logs.map(l => l.dateString)).size;

  const initials = user.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const levelInfo = getLevelFromXP(user.totalXP);
  const levelProgress = getLevelProgress(user.totalXP);
  const xpToNext = getXPToNextLevel(user.totalXP);
  const isMaxLevel = levelInfo.level === 10;

  // XP progress bar animation
  const xpBarWidth = useRef(new Animated.Value(0)).current;
  const [hasAnimated, setHasAnimated] = useState(false);

  // Staggered animations for stats and achievements
  const statsAnimations = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  // Initialize achievement animations based on the number of global achievements
  const achievementAnimations = useRef(
    Array.from({ length: GLOBAL_ACHIEVEMENTS.length }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const onXPBarLayout = () => {
    if (!hasAnimated) {
      setHasAnimated(true);
      Animated.timing(xpBarWidth, {
        toValue: levelProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  };

  // Trigger staggered animations on mount
  useEffect(() => {
    // Stats animations
    const statsAnims = statsAnimations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(80, statsAnims).start();

    // Achievements animations (triggered after stats)
    setTimeout(() => {
      const achAnims = achievementAnimations.map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.stagger(60, achAnims).start();
    }, 600);
  }, []);

  // Stats
  const stats = [
    { label: 'Streak', value: `${user.currentStreak}d`, icon: 'flame' as const, color: '#F97316' },
    { label: 'Best Streak', value: `${user.longestStreak}d`, icon: 'trophy' as const, color: '#EAB308' },
    { label: 'Books Done', value: completedBooks, icon: 'checkmark-done-circle' as const, color: COLORS.accent },
    { label: 'Total Pages', value: totalPagesRead, icon: 'book' as const, color: '#8B5CF6' },
    { label: 'Days Read', value: daysLogged, icon: 'calendar' as const, color: '#EC4899' },
    { label: 'Daily Goal', value: `${user.currentGoal}p`, icon: 'flag' as const, color: COLORS.gold },
  ];

  // Achievements display
  const allGlobal = GLOBAL_ACHIEVEMENTS;
  const earned = user.achievements;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Ionicons name="person" size={20} color={COLORS.accent} />
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Profile Card ── */}
        <View style={styles.heroCard}>
          {/* Avatar - Clickable to open Level Details */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => setLevelModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { borderColor: levelInfo.color }]}>
              <Image source={pfp} style={styles.avatarImage} />
            </View>
            {/* Level badge overlapping avatar */}
            <View style={[styles.levelBadgeFloat, { backgroundColor: levelInfo.color }]}>
              <Text style={styles.levelBadgeText}>{levelInfo.level}</Text>
            </View>
          </TouchableOpacity>

          {/* Name + level info - Clickable to open Level Details */}
          <Text style={styles.displayName}>{user.displayName}</Text>
          <TouchableOpacity 
            style={styles.levelRow}
            onPress={() => setLevelModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
            <View>
              <Text style={[styles.levelName, { color: levelInfo.color }]}>
                {levelInfo.name}
              </Text>
              <Text style={styles.levelHindi}>{levelInfo.hindiName}</Text>
            </View>
          </TouchableOpacity>

          {/* XP Progress Bar */}
          <View style={styles.xpSection} onLayout={onXPBarLayout}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpLabelLeft}>{user.totalXP} XP</Text>
              {isMaxLevel ? (
                <Text style={styles.xpLabelRight}>MAX LEVEL 👑</Text>
              ) : (
                <Text style={styles.xpLabelRight}>{xpToNext} XP to next level</Text>
              )}
            </View>
            <View style={styles.xpBarBg}>
              <Animated.View
                style={[
                  styles.xpBarFill,
                  {
                    backgroundColor: levelInfo.color,
                    width: xpBarWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Streak Freeze Tokens - Clickable to open Streak Details */}
          <TouchableOpacity 
            style={styles.freezeRow}
            onPress={() => setStreakModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="snow" size={13} color="#60A5FA" />
            <Text style={styles.freezeLabel}>Streak Freeze:</Text>
            <View style={styles.freezeTokens}>
              {Array.from({ length: FREEZE_TOKEN_MAX }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.freezeToken,
                    i < user.streakFreezeAvailable
                      ? styles.freezeTokenActive
                      : styles.freezeTokenInactive,
                  ]}
                >
                  <Ionicons
                    name="snow"
                    size={10}
                    color={i < user.streakFreezeAvailable ? '#60A5FA' : '#CBD5E1'}
                  />
                </View>
              ))}
            </View>
            <Text style={styles.freezeCount}>
              {user.streakFreezeAvailable}/{FREEZE_TOKEN_MAX}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Grid ── */}
        <Text style={styles.sectionLabel}>Reading Summary</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.statCell,
                {
                  opacity: statsAnimations[i].opacity,
                  transform: [{ translateY: statsAnimations[i].translateY }],
                },
              ]}
            >
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ── Daily Goal Card ── */}
        <Text style={styles.sectionLabel}>Daily Target</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalTitle}>Daily Reading Target</Text>
              <Text style={styles.goalSub}>Smart Goal Engine keeps this balanced</Text>
            </View>
            <View style={styles.goalControlRow}>
              <TouchableOpacity
                style={styles.goalBtn}
                onPress={() => updateGoal(Math.max(1, user.baselineGoal - 5))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color={COLORS.accent} />
              </TouchableOpacity>
              <Text style={styles.goalValue}>{user.baselineGoal} pgs</Text>
              <TouchableOpacity
                style={styles.goalBtn}
                onPress={() => updateGoal(user.baselineGoal + 5)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
          {user.currentGoal !== user.baselineGoal && (
            <View style={styles.goalAdjustedBanner}>
              <Ionicons name="trending-down" size={12} color="#F97316" />
              <Text style={styles.goalAdjustedText}>
                Smart Engine adjusted to {user.currentGoal} pgs/day to match your pace
              </Text>
            </View>
          )}
        </View>

        {/* ── Level Progress Map ── */}
        <Text style={styles.sectionLabel}>Level Journey</Text>
        <TouchableOpacity
          style={styles.levelMapCard}
          onPress={() => setLevelModalVisible(true)}
          activeOpacity={0.7}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.levelMapRow}>
              {LEVEL_TABLE.map((lvl, i) => {
                const isEarned = user.level >= lvl.level;
                const isCurrent = user.level === lvl.level;
                return (
                  <View key={lvl.level} style={styles.levelMapItem}>
                    <View
                      style={[
                        styles.levelMapCircle,
                        isEarned && { backgroundColor: lvl.color, borderColor: lvl.color },
                        isCurrent && styles.levelMapCircleCurrent,
                      ]}
                    >
                      <Text style={styles.levelMapEmoji}>{lvl.emoji}</Text>
                    </View>
                    <Text
                      style={[
                        styles.levelMapName,
                        isEarned && { color: lvl.color, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {lvl.level}
                    </Text>
                    {i < LEVEL_TABLE.length - 1 && (
                      <View
                        style={[
                          styles.levelMapConnector,
                          isEarned && { backgroundColor: lvl.color },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </TouchableOpacity>

        {/* ── Global Achievements Grid ── */}
        <Text style={styles.sectionLabel}>
          Achievements{' '}
          <Text style={styles.sectionLabelCount}>
            {earned.filter(id => !id.includes('__')).length}/{allGlobal.length}
          </Text>
        </Text>
        <View style={styles.achievementsGrid}>
          {allGlobal.map((ach, i) => {
            const isUnlocked = earned.includes(ach.id);
            return (
              <TouchableOpacity
                key={ach.id}
                activeOpacity={isUnlocked ? 0.7 : 1}
                onPress={() => {
                  if (isUnlocked) {
                    setSelectedAchievement(ach.id);
                    setAchievementModalVisible(true);
                  }
                }}
              >
                <Animated.View
                  style={[
                    styles.achCell,
                    isUnlocked && styles.achCellUnlocked,
                    {
                      opacity: achievementAnimations[i].opacity,
                      transform: [{ translateY: achievementAnimations[i].translateY }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.achCellEmoji,
                      !isUnlocked && styles.achCellEmojiLocked,
                    ]}
                  >
                    {isUnlocked ? ach.emoji : '🔒'}
                  </Text>
                  <Text
                    style={[
                      styles.achCellName,
                      !isUnlocked && styles.achCellNameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {isUnlocked ? ach.name : '???'}
                  </Text>
                  {isUnlocked && (
                    <View style={styles.achXPBadge}>
                      <Text style={styles.achXPBadgeText}>+{ach.xpReward}</Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Motivation Card ── */}
        <View style={styles.motivationCard}>
          <Ionicons name="sparkles" size={16} color={COLORS.gold} />
          <Text style={styles.motivationText}>
            "The more that you read, the more things you will know."
          </Text>
          <Text style={styles.motivationAuthor}>— Dr. Seuss</Text>
        </View>

        {/* ── Sign Out Button ── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={async () => {
            try {
              await signOut();
              setAuthUser(null);
            } catch {
              // Sign out error — ignore
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Achievement modal when triggered from profile actions */}
      {pendingAchievements.length > 0 && (
        <AchievementUnlockModal
          pending={pendingAchievements}
          onDismiss={dismissPendingAchievement}
        />
      )}

      {/* New detail modals */}
      <LevelDetailsModal
        visible={levelModalVisible}
        onClose={() => setLevelModalVisible(false)}
      />
      <AchievementDetailModal
        visible={achievementModalVisible}
        onClose={() => setAchievementModalVisible(false)}
        achievementId={selectedAchievement}
      />
      <StreakDetailModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  levelBadgeFloat: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginBottom: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  levelEmoji: {
    fontSize: 28,
  },
  levelName: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONTS.serif,
  },
  levelHindi: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontStyle: 'italic',
  },

  // XP Bar
  xpSection: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpLabelLeft: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },
  xpLabelRight: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  xpBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Freeze tokens
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.xs,
  },
  freezeLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  freezeTokens: {
    flexDirection: 'row',
    gap: 4,
  },
  freezeToken: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  freezeTokenActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: '#60A5FA',
  },
  freezeTokenInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  freezeCount: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
  },

  // Stats
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: 2,
  },
  sectionLabelCount: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.accent,
    textTransform: 'none',
    letterSpacing: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: 6,
  },
  statCell: {
    width: '31.5%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: 6,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.mutedText,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },

  // Goal card
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  goalSub: {
    fontSize: 10,
    color: COLORS.mutedText,
    marginTop: 1,
  },
  goalControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  goalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 89, 0.04)',
  },
  goalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 44,
    textAlign: 'center',
  },
  goalAdjustedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  goalAdjustedText: {
    fontSize: 11,
    color: '#F97316',
    flex: 1,
    fontWeight: '500',
  },

  // Level Map
  levelMapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  levelMapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  levelMapItem: {
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
  },
  levelMapCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelMapCircleCurrent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.15 }],
  },
  levelMapEmoji: {
    fontSize: 18,
  },
  levelMapName: {
    fontSize: 9,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 2,
    width: 40,
    position: 'absolute',
    bottom: -14,
  },
  levelMapConnector: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },

  // Achievements Grid
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  achCell: {
    width: (width - SPACING.md * 2 - 6 * 2) / 3,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  achCellUnlocked: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74, 124, 89, 0.03)',
  },
  achCellEmoji: {
    fontSize: 22,
    marginBottom: 3,
  },
  achCellEmojiLocked: {
    opacity: 0.3,
  },
  achCellName: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  achCellNameLocked: {
    color: COLORS.mutedText,
    opacity: 0.5,
  },
  achXPBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  achXPBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#92400E',
  },

  // Motivation
  motivationCard: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
  },
  motivationText: {
    color: COLORS.background,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
  },
  motivationAuthor: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
