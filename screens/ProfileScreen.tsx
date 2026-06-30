import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { useReading } from '../context/ReadingContext';

export const ProfileScreen: React.FC = () => {
  const { user, books, logs, updateGoal } = useReading();

  const totalPagesRead = logs.reduce((sum, l) => sum + l.pagesReadDelta, 0);
  const completedBooks = books.filter(b => b.status === 'completed').length;
  const daysLogged = new Set(logs.map(l => l.dateString)).size;
  const initials = user.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    { label: 'Streak', value: `${user.currentStreak}d`, icon: 'flame', color: '#F97316' },
    { label: 'Freezes', value: user.streakFreezeAvailable, icon: 'snow', color: '#3B82F6' },
    { label: 'Completed', value: completedBooks, icon: 'checkmark-done-circle', color: COLORS.accent },
    { label: 'Total Pages', value: totalPagesRead, icon: 'book', color: '#8B5CF6' },
    { label: 'Days Read', value: daysLogged, icon: 'calendar', color: '#EC4899' },
    { label: 'Target', value: `${user.currentGoal}p`, icon: 'flag', color: COLORS.gold },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Ionicons name="person" size={20} color={COLORS.accent} />
        <Text style={styles.headerTitle}>Profile Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Compact Profile Header */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#F97316" />
                <Text style={styles.streakBadgeText}>{user.currentStreak} Day Streak</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Reader</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compact Stats Grid (3 columns) */}
        <Text style={styles.sectionLabel}>Reading Summary</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCell}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '12' }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Compact Goal Settings Card */}
        <Text style={styles.sectionLabel}>Daily Target Goal</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalTitle}>Daily Reading Target</Text>
              <Text style={styles.goalSub}>Keep your baseline habits in check</Text>
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
        </View>

        {/* Motivational Card */}
        <View style={styles.motivationCard}>
          <Ionicons name="sparkles" size={16} color={COLORS.gold} />
          <Text style={styles.motivationText}>
            "The more that you read, the more things you will know."
          </Text>
          <Text style={styles.motivationAuthor}>— Dr. Seuss</Text>
        </View>
      </ScrollView>
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
    paddingBottom: 80, // buffer for nav bar
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(74, 124, 89, 0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    fontFamily: FONTS.serif,
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
  },
  activeBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
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
    fontSize: 11,
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
  motivationCard: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
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
});
