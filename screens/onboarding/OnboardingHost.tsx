import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { HookScreen } from './HookScreen';
import { GoalScreen } from './GoalScreen';
import { DailyGoalScreen } from './DailyGoalScreen';
import { LiveDemoScreen } from './LiveDemoScreen';
import { RemindersOptInScreen } from './RemindersOptInScreen';
import { ProgressDots } from './ProgressDots';
import { haptics } from './haptics';
import { OnboardingPreferences, ReadingGoal } from './types';

interface Props {
  onComplete: (prefs: OnboardingPreferences) => void;
}

const TOTAL_STEPS = 5;

export const OnboardingHost: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [dailyPageTarget, setDailyPageTarget] = useState(10);

  // Cross-fade + slide between steps.
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const transitionTo = (nextStep: number, direction: 1 | -1 = 1) => {
    haptics.tapLight();
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -20 * direction, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slide.setValue(20 * direction);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
      ]).start();
    });
  };

  const finish = (skipped: boolean) => {
    haptics.success();
    onComplete({
      readingGoal: goal,
      dailyPageTarget,
      onboardingSkipped: skipped,
      // Back-compat with existing OnboardingPreferences consumers.
      goals: goal ? [goal] : [],
      preferredReading: 'books',
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => transitionTo(step - 1, -1)}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.mutedText} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <ProgressDots total={TOTAL_STEPS} current={step} />
        {step > 0 && step < TOTAL_STEPS - 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={() => finish(true)}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color={COLORS.mutedText} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <Animated.View
        style={[styles.stage, { opacity: fade, transform: [{ translateX: slide }] }]}
      >
        {step === 0 && (
          <HookScreen
            onNext={() => transitionTo(1)}
            onSignIn={() => finish(true)}
          />
        )}
        {step === 1 && (
          <GoalScreen
            value={goal}
            onChange={setGoal}
            onNext={() => transitionTo(2)}
          />
        )}
        {step === 2 && (
          <DailyGoalScreen
            value={dailyPageTarget}
            onChange={setDailyPageTarget}
            onNext={() => transitionTo(3)}
          />
        )}
        {step === 3 && (
          <LiveDemoScreen
            onFinish={() => transitionTo(4)}
            onSkip={() => transitionTo(4)}
          />
        )}
        {step === 4 && (
          <RemindersOptInScreen onDone={() => finish(false)} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  stage: { flex: 1 },
});
