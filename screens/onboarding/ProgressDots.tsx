import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  total: number;
  current: number; // 0-indexed
}

export const ProgressDots: React.FC<Props> = ({ total, current }) => {
  const widths = useRef(
    Array.from({ length: total }, (_, i) => new Animated.Value(i === current ? 24 : 6)),
  ).current;

  useEffect(() => {
    widths.forEach((w, i) => {
      Animated.spring(w, {
        toValue: i === current ? 24 : 6,
        useNativeDriver: false,
        friction: 8,
        tension: 90,
      }).start();
    });
  }, [current, widths]);

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: current + 1 }}>
      {widths.map((w, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: w,
              backgroundColor: i <= current ? COLORS.accent : COLORS.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
