import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface WordSearchBarProps {
  onPressSearch: () => void;
}

export const WordSearchBar: React.FC<WordSearchBarProps> = ({ onPressSearch }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPressSearch}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="search" size={18} color={COLORS.accent} />
      </View>
      <Text style={styles.placeholder}>Look up a word...</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Dictionary</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.mutedText,
    fontFamily: FONTS.serif,
  },
  badge: {
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
  },
});
