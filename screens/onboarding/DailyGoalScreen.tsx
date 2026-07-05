import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { haptics } from './haptics';

interface Props {
  value: number;
  onChange: (n: number) => void;
  onNext: () => void;
}

const PRESETS = [5, 10, 20, 30];

// Rough average book length assumption for the payoff line.
const bookEta = (pagesPerDay: number) => {
  if (pagesPerDay <= 0) return '';
  const daysPerBook = Math.round(280 / pagesPerDay);
  if (daysPerBook <= 14) return `~${daysPerBook} days per book`;
  const weeks = Math.round(daysPerBook / 7);
  return `~${weeks} ${weeks === 1 ? 'week' : 'weeks'} per book`;
};

export const DailyGoalScreen: React.FC<Props> = ({ value, onChange, onNext }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set a daily page goal</Text>
        <Text style={styles.subtitle}>You can change this anytime in Profile.</Text>
      </View>

      <View style={styles.numberBlock}>
        <View style={styles.stepper}>
          <StepBtn onPress={() => { haptics.tapLight(); onChange(Math.max(1, value - 1)); }} icon="remove" />
          <View style={styles.numberWrap}>
            <Text style={styles.number}>{value}</Text>
            <Text style={styles.unit}>pages / day</Text>
          </View>
          <StepBtn onPress={() => { haptics.tapLight(); onChange(Math.min(200, value + 1)); }} icon="add" />
        </View>

        <Text style={styles.payoff}>{bookEta(value) || 'Pick a page goal'} 📚</Text>

        <View style={styles.presets}>
          {PRESETS.map(n => (
            <PresetChip key={n} n={n} selected={value === n} onPress={() => { haptics.select(); onChange(n); }} />
          ))}
        </View>
      </View>

      <PrimaryButton label="Continue" icon="arrow-forward" onPress={onNext} />
    </View>
  );
};

const StepBtn: React.FC<{ onPress: () => void; icon: 'add' | 'remove' }> = ({ onPress, icon }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, friction: 5 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start()}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase goal' : 'Decrease goal'}
    >
      <Animated.View style={[styles.stepBtn, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={26} color={COLORS.text} />
      </Animated.View>
    </Pressable>
  );
};

const PresetChip: React.FC<{ n: number; selected: boolean; onPress: () => void }> = ({ n, selected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${n} pages`}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{n}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: { marginBottom: SPACING.lg },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.mutedText,
    lineHeight: 22,
  },
  numberBlock: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: SPACING.lg,
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  numberWrap: { alignItems: 'center', minWidth: 140 },
  number: {
    fontFamily: FONTS.serif,
    fontSize: 76,
    lineHeight: 84,
    fontWeight: '700',
    color: COLORS.text,
  },
  unit: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.mutedText,
    letterSpacing: 0.5,
  },
  payoff: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.accent,
    marginBottom: SPACING.xl,
  },
  presets: { flexDirection: 'row', gap: 12 },
  chip: {
    minWidth: 56,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(74,124,89,0.08)' },
  chipText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.mutedText, fontWeight: '600' },
  chipTextSelected: { color: COLORS.accent },
});
