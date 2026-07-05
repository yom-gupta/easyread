import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { haptics } from './haptics';
import { ReadingGoal } from './types';

interface Props {
  value: ReadingGoal | null;
  onChange: (g: ReadingGoal) => void;
  onNext: () => void;
}

const OPTIONS: {
  id: ReadingGoal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
}[] = [
  { id: 'habit',         icon: 'flame-outline',      title: 'Build a daily habit',   hint: 'Consistency over volume' },
  { id: 'vocabulary',    icon: 'bookmark-outline',   title: 'Grow my vocabulary',    hint: 'Save & revisit new words' },
  { id: 'comprehension', icon: 'bulb-outline',       title: 'Read more carefully',   hint: 'Reflect and remember' },
  { id: 'speed',         icon: 'flash-outline',      title: 'Read faster',           hint: 'Pace yourself with data' },
];

const OptionCard: React.FC<{
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  onPress: () => void;
}> = ({ selected, icon, title, hint, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
      onPress={onPress}
      style={{ width: '100%' }}
    >
      <Animated.View style={[styles.card, selected && styles.cardSelected, { transform: [{ scale }] }]}>
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons name={icon} size={24} color={selected ? COLORS.white : COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardHint}>{hint}</Text>
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? COLORS.accent : COLORS.border}
        />
      </Animated.View>
    </Pressable>
  );
};

export const GoalScreen: React.FC<Props> = ({ value, onChange, onNext }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>What matters most to you?</Text>
      <Text style={styles.subtitle}>Pick one — we'll shape your dashboard around it.</Text>
    </View>

    <View style={styles.list}>
      {OPTIONS.map(o => (
        <OptionCard
          key={o.id}
          selected={value === o.id}
          icon={o.icon}
          title={o.title}
          hint={o.hint}
          onPress={() => {
            haptics.select();
            onChange(o.id);
          }}
        />
      ))}
    </View>

    <PrimaryButton
      label="Continue"
      icon="arrow-forward"
      disabled={!value}
      onPress={onNext}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: { marginBottom: SPACING.xl },
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
  list: { flex: 1, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,124,89,0.06)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74,124,89,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: COLORS.accent },
  cardTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardHint: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.mutedText },
});
