import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { LevelInfo } from '../utils/xpHelpers';

const { width } = Dimensions.get('window');

interface LevelUpModalProps {
  levelInfo: LevelInfo | null;
  onDismiss: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ levelInfo, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (levelInfo) {
      // Reset
      scaleAnim.setValue(0.6);
      opacityAnim.setValue(0);
      emojiScale.setValue(0);
      ringSpin.setValue(0);

      const ringLoop = Animated.loop(
        Animated.timing(ringSpin, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
      );
      ringLoop.start();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(emojiScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 5,
          }),
        ]),
      ]).start();

      // Auto-dismiss after 5s
      const timer = setTimeout(onDismiss, 5000);
      return () => {
        clearTimeout(timer);
        ringLoop.stop();
      };
    }
  }, [levelInfo]);

  if (!levelInfo) return null;

  return (
    <Modal
      transparent
      visible={!!levelInfo}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Confetti overlay */}
      <LottieView
        source={require('../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Gradient accent top bar */}
          <View style={[styles.accentBar, { backgroundColor: levelInfo.color }]} />

          {/* Level indicator */}
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>LEVEL {levelInfo.level}</Text>
          </View>

          <View style={styles.emojiStage}>
            <Animated.View
              style={[
                styles.emojiRing,
                styles.emojiRingOuter,
                {
                  borderColor: levelInfo.color,
                  transform: [
                    { rotate: ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.emojiRing,
                styles.emojiRingInner,
                {
                  borderColor: levelInfo.color,
                  transform: [
                    { rotate: ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
              {levelInfo.emoji}
            </Animated.Text>
          </View>

          {/* Name */}
          <Text style={[styles.levelName, { color: levelInfo.color }]}>
            {levelInfo.name}
          </Text>

          {/* Hindi name */}
          <Text style={styles.hindiName}>{levelInfo.hindiName}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Roast line */}
          <Text style={styles.roastLine}>"{levelInfo.roastLine}"</Text>

          {/* Dismiss button */}
          <TouchableOpacity
            style={[styles.dismissBtn, { backgroundColor: levelInfo.color }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissBtnText}>Let's Go! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 30, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 25,
  },
  accentBar: {
    width: '100%',
    height: 6,
    marginBottom: SPACING.md,
  },
  levelPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mutedText,
    letterSpacing: 2,
  },
  emojiStage: {
    width: 116,
    height: 116,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  emojiRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.22,
  },
  emojiRingOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderStyle: 'dashed',
  },
  emojiRingInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderStyle: 'dotted',
  },
  emoji: {
    fontSize: 72,
  },
  levelName: {
    fontSize: 28,
    fontFamily: FONTS.serif,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: SPACING.md,
  },
  hindiName: {
    fontSize: 16,
    color: COLORS.mutedText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  roastLine: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  dismissBtn: {
    borderRadius: 14,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    marginHorizontal: SPACING.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
});
