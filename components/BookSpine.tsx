import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { Book } from '../context/ReadingContext';
import { BookBadge } from '../utils/bookHelpers';
import { MiniHeatmap } from './PerBookHeatmap';

const SPINE_COLORS = ['#4A7C59', '#2563EB', '#9333EA', '#8B6914', '#C5A880', '#1A2E40', '#6B4F10'];

interface BookSpineProps {
  book: Book;
  isCurrent?: boolean;
  badges?: BookBadge[];
  logData?: Record<string, number>;
  onPress: () => void;
  onSetActive?: () => void;
  index?: number;
  visible?: boolean;
  enterDelay?: number;
}

export const BookSpine: React.FC<BookSpineProps> = ({
  book,
  isCurrent,
  badges = [],
  logData = {},
  onPress,
  onSetActive,
  index = 0,
  visible = true,
  enterDelay = 0,
}) => {
  const pct = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
  const spineColor = SPINE_COLORS[index % SPINE_COLORS.length];
  const heightVariation = 118 + (index % 3) * 12;

  const fallAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const prevVisible = useRef(visible);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      fallAnim.setValue(0);
      Animated.spring(fallAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay: enterDelay,
        useNativeDriver: true,
      }).start();
    } else if (prevVisible.current) {
      Animated.timing(fallAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    prevVisible.current = visible;
  }, [visible, enterDelay]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={{
        opacity: fallAnim,
        transform: [
          {
            translateY: fallAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [90, 0],
            }),
          },
          {
            rotate: fallAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['12deg', '4deg', '0deg'],
            }),
          },
          {
            scale: fallAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ],
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={[styles.spineWrap, { height: heightVariation + 36 }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.topBadge, { height: pct > 0 ? 20 : 30 }]}>
          <View style={styles.badgeRow}>
            <Ionicons name="bookmark" size={10} color={COLORS.accent} />
            <Text style={styles.topBadgeText}>{pct}%</Text>
          </View>
          <View style={[styles.progressStrip, { width: 42 }]}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>



        {/* {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.slice(0, 2).map(b => (
              <View key={b.id} style={[styles.badgeDot, { backgroundColor: b.color }]}>
                <Ionicons name={b.icon as any} size={7} color="#FFF" />
              </View>
            ))}
          </View>
        )} */}


        <View style={[styles.bookShadow, { width: 48 }]} />

        <View style={[styles.spine, { height: heightVariation, backgroundColor: spineColor }]}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: spineColor }]}>
              <Ionicons name="book" size={18} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          <View style={styles.spineOverlay}>
            <Text style={styles.spineTitle} numberOfLines={4}>
              {book.title}
            </Text>
          </View>
          {isCurrent && (
            <View style={styles.currentDot}>
              <View style={styles.currentDotInner} />
            </View>
          )}
          {book.status === 'completed' && (
            <View style={styles.completedRibbon}>
              <Ionicons name="checkmark" size={10} color="#FFF" />
            </View>
          )}
        </View>



      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  spineWrap: {
    width: 56,
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  topBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: '100%',
    justifyContent: 'center',
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
  },
  bookShadow: {
    position: 'absolute',
    bottom: 26,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 50,
    alignSelf: 'center',
  },
  spine: {
    width: 52,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  cover: {
    ...StyleSheet.absoluteFill,
    opacity: 0.88,
  },
  coverPlaceholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spineOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
    padding: 4,
  },
  spineTitle: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: FONTS.serif,
    textTransform: 'uppercase',
  },
  currentDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  completedRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.accent,
    width: 16,
    height: 16,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStrip: {
    width: 52,
    height: 4,
    backgroundColor: '#D4C4A8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtn: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(74,124,89,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
