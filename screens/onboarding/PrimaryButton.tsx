import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { haptics } from './haptics';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  disabled,
  icon,
  variant = 'primary',
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const isGhost = variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      }}
      onPress={() => {
        if (disabled) return;
        haptics.tapMedium();
        onPress();
      }}
      style={[styles.wrap, style]}
    >
      <Animated.View
        style={[
          styles.btn,
          isGhost ? styles.ghost : styles.primary,
          disabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.label, isGhost && styles.ghostLabel]}>{label}</Text>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={isGhost ? COLORS.text : COLORS.white}
            style={{ marginLeft: 8 }}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  btn: {
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  disabled: { opacity: 0.4 },
  label: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ghostLabel: { color: COLORS.text },
});
