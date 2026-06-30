import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export const NavBar: React.FC = () => {
  const handlePress = (label: string) => {
    // Placeholder navigation – replace with actual navigation logic
    console.log(`NavBar: ${label} pressed`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tab} onPress={() => handlePress('Analytics')} activeOpacity={0.7}>
        <Ionicons name="analytics-outline" size={22} color={COLORS.text} />
        <Text style={styles.tabLabel}>Analytics</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => handlePress('Library')} activeOpacity={0.7}>
        <Ionicons name="book-outline" size={22} color={COLORS.text} />
        <Text style={styles.tabLabel}>Library</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => handlePress('Profile')} activeOpacity={0.7}>
        <Ionicons name="person-outline" size={22} color={COLORS.text} />
        <Text style={styles.tabLabel}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.accent,
    paddingBottom: SPACING.md,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 2,
    fontWeight: '600',
  },
});
