import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface ReadingProgressBarProps {
  pagesRead: number;
  totalPages: number;
  height?: number;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  pagesRead,
  totalPages,
  height = 8,
}) => {
  const pct = totalPages > 0 ? Math.min(100, Math.max(0, (pagesRead / totalPages) * 100)) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, height }]} />
      </View>

      <View style={[styles.bookmarkWrap, { left: `${pct}%` }]}>
        <Ionicons
          name="bookmark"
          size={18}
          color={COLORS.accent}
          style={styles.markerIcon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  track: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#5e946ebe',
    borderRadius: 6,
  },
  bookmarkWrap: {
    position: 'absolute',
    top: -3,
    marginLeft: -8,
    zIndex: 2,
  },
  markerIcon: {
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
