import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const appLogo = require('../assets/logo.png');

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  iconColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  title: string;
  subtitle: string;
  decoration: string; // emoji for floating decoration
}

const STEPS: OnboardingStep[] = [
  {
    icon: 'book',
    iconColor: '#4A7C59',
    bgGradientStart: '#F0F7F2',
    bgGradientEnd: '#E8F5E9',
    title: 'Build a\nReading Habit',
    subtitle: 'Track your daily reading progress and watch your streak grow. Small pages, big impact.',
    decoration: '📖',
  },
  {
    icon: 'trending-up',
    iconColor: '#2563EB',
    bgGradientStart: '#EFF6FF',
    bgGradientEnd: '#DBEAFE',
    title: 'Smart Goals\nThat Adapt',
    subtitle: 'Our AI adjusts your daily page goal based on your pace. No pressure, just progress.',
    decoration: '📊',
  },
  {
    icon: 'book-outline',
    iconColor: '#9333EA',
    bgGradientStart: '#FAF5FF',
    bgGradientEnd: '#F3E8FF',
    title: 'Learn New\nWords Daily',
    subtitle: 'Look up any word instantly, hear its pronunciation, and save it to your personal vocabulary notebook.',
    decoration: '✨',
  },
  {
    icon: 'flame',
    iconColor: '#EA580C',
    bgGradientStart: '#FFF7ED',
    bgGradientEnd: '#FED7AA',
    title: 'Ready to\nStart Reading?',
    subtitle: 'Your reading journey begins now. Set your first book and let the pages turn.',
    decoration: '🔥',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Main content animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  
  // Floating decorations
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  
  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Button animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const btnGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateIn();
    startFloatingAnimation();
    startButtonGlow();
  }, []);

  const startFloatingAnimation = () => {
    const createFloat = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    createFloat(float1, 3000);
    createFloat(float2, 4000);
    createFloat(float3, 2500);
  };

  const startButtonGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(btnGlow, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    iconScale.setValue(0);

    Animated.stagger(120, [
      // Icon pops in
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
      // Content fades and slides up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const animateOut = (onDone: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleNext = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        friction: 3,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentStep < STEPS.length - 1) {
      animateOut(() => {
        setCurrentStep(prev => prev + 1);
        setTimeout(animateIn, 50);
      });
    } else {
      // Final step — animate out and complete
      animateOut(handleComplete);
    }
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: step.bgGradientStart }]}>
      <StatusBar barStyle="dark-content" />

      {/* Floating decorations */}
      <Animated.Text
        style={[
          styles.floatingEmoji,
          styles.float1,
          {
            transform: [
              { translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
              { rotate: float1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) },
            ],
            opacity: float1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] }),
          },
        ]}
      >
        {step.decoration}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.floatingEmoji,
          styles.float2,
          {
            transform: [
              { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
              { rotate: float2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-20deg'] }) },
            ],
            opacity: float2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] }),
          },
        ]}
      >
        {step.decoration}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.floatingEmoji,
          styles.float3,
          {
            transform: [
              { translateY: float3.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) },
              { scale: float3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) },
            ],
            opacity: float3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.4, 0.15] }),
          },
        ]}
      >
        {step.decoration}
      </Animated.Text>

      {/* Main content area */}
      <View style={styles.contentArea}>
        {/* Icon / App logo */}
        <Animated.View
          style={[
            styles.iconContainer,
            currentStep === 0 || isLast ? styles.logoContainer : { backgroundColor: step.bgGradientEnd },
            {
              transform: [
                { scale: iconScale },
                { rotate: iconScale.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-30deg', '10deg', '0deg'] }) },
              ],
            },
          ]}
        >
          {currentStep === 0 || isLast ? (
            <Image source={appLogo} style={styles.appLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.iconInner, { backgroundColor: step.iconColor + '18' }]}>
              <Ionicons name={step.icon as any} size={48} color={step.iconColor} />
            </View>
          )}
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
        </Animated.View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomArea}>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: step.iconColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Step dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentStep ? step.iconColor : '#D1D5DB',
                  width: i === currentStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: step.iconColor }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Animated.View
              style={[
                styles.ctaBtnGlow,
                {
                  backgroundColor: step.iconColor,
                  opacity: btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
                  transform: [{ scale: btnGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
                },
              ]}
            />
            <Text style={styles.ctaText}>
              {isLast ? "Let's Go!" : 'Continue'}
            </Text>
            <Ionicons
              name={isLast ? 'rocket' : 'arrow-forward'}
              size={20}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Step counter */}
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {STEPS.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  logoContainer: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  appLogo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
    fontFamily: FONTS.serif,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    maxWidth: 300,
  },
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  ctaBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stepCounter: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  float1: {
    top: height * 0.12,
    left: width * 0.1,
  },
  float2: {
    top: height * 0.25,
    right: width * 0.08,
  },
  float3: {
    bottom: height * 0.35,
    left: width * 0.15,
  },
});
