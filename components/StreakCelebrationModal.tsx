import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { StreakTrigger } from '../context/ReadingContext';

interface StreakCelebrationModalProps {
  trigger: StreakTrigger | null;
  onDismiss: () => void;
}

const { width, height } = Dimensions.get('window');

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  trigger,
  onDismiss,
}) => {
  const [displayedCount, setDisplayedCount] = useState(0);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const countScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger?.visible) {
      setDisplayedCount(trigger.isBreak ? 0 : Math.max(0, trigger.count - 1));
      
      // Reset values
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      shakeAnim.setValue(0);
      countScaleAnim.setValue(1);

      // Trigger entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (trigger.isBreak) {
          // Play a shake animation for streak break
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        } else {
          // Increment the count with a scale-up effect
          setTimeout(() => {
            setDisplayedCount(trigger.count);
            Animated.sequence([
              Animated.timing(countScaleAnim, {
                toValue: 1.6,
                duration: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.spring(countScaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
              })
            ]).start();
          }, 800);
        }
      });
    }
  }, [trigger]);

  if (!trigger?.visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={trigger.visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Render Lottie confetti only for successful streaks */}
        {!trigger.isBreak && (
          <LottieView
            source={require('../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ],
            },
          ]}
        >
          {trigger.isBreak ? (
            // Streak Break Display
            <View style={styles.content}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: COLORS.danger }]}>
                <Ionicons name="flash-off" size={64} color={COLORS.danger} />
              </View>
              
              <Text style={styles.title}>Streak Broken</Text>
              <Text style={styles.description}>
                You missed a couple of days and ran out of freezes. But don't worry, every day is a fresh chapter!
              </Text>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.danger }]}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Restart Streak</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Streak Success/Increase Display
            <View style={styles.content}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#F97316' }]}>
                <Ionicons name="flame" size={68} color="#F97316" />
              </View>

              <Animated.View style={{ transform: [{ scale: countScaleAnim }] }}>
                <Text style={styles.streakNumber}>{displayedCount}</Text>
              </Animated.View>
              
              <Text style={styles.title}>Day Reading Streak!</Text>
              <Text style={styles.description}>
                Incredible consistency! You logged today's pages and kept your reading momentum alive.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Keep it Up!</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 46, 64, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.gold,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#F97316',
    fontFamily: FONTS.serif,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.mutedText,
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
