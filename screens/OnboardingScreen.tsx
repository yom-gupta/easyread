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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const appLogo = require('../assets/logo.png');
const { width, height } = Dimensions.get('window');

export interface OnboardingPreferences {
  goals: string[];
  preferredReading: string;
  onboardingSkipped: boolean;
}

interface OnboardingScreenProps {
  onComplete: (preferences: OnboardingPreferences) => void;
}

const GOAL_OPTIONS = [
  { id: 'vocabulary', label: 'Vocabulary', icon: 'book' as const },
  { id: 'speed', label: 'Reading Speed', icon: 'flash' as const },
  { id: 'comprehension', label: 'Comprehension', icon: 'bulb' as const },
  { id: 'all', label: 'All of the above', icon: 'star' as const },
];

const READING_OPTIONS = [
  { id: 'books', label: 'Books', icon: 'bookmarks' as const },
  { id: 'articles', label: 'Articles', icon: 'document-text' as const },
  { id: 'social', label: 'Social', icon: 'chatbubbles' as const },
  { id: 'docs', label: 'Docs', icon: 'document' as const },
];

type ScreenPhase = 'welcome' | 'demo' | 'preferences';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<ScreenPhase>('welcome');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedReading, setSelectedReading] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const btnGlow = useRef(new Animated.Value(0)).current;

  const phaseFade = useRef(new Animated.Value(1)).current;
  const phaseSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(sparkleRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnGlow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const transitionTo = (next: ScreenPhase) => {
    Animated.parallel([
      Animated.timing(phaseFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(phaseSlide, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setPhase(next);
      phaseFade.setValue(0);
      phaseSlide.setValue(20);
      Animated.parallel([
        Animated.timing(phaseFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(phaseSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      onComplete({ goals: [], preferredReading: '', onboardingSkipped: true });
    });
  };

  const handleGoalToggle = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(phaseFade, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(phaseSlide, { toValue: 20, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onComplete({
        goals: selectedGoals,
        preferredReading: selectedReading,
        onboardingSkipped: false,
      });
    });
  };

  const canFinish = selectedGoals.length > 0 && selectedReading.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {phase === 'welcome' && (
        <Animated.View style={[styles.centered, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.chipBadge}>
            <Ionicons name="create-outline" size={14} color={COLORS.accent} />
            <Text style={styles.chipText}>A note from the founder</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              top: height * 0.18,
              right: width * 0.15,
              transform: [{ rotate: sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
            }}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.gold || '#D4A843'} />
          </Animated.View>

          <Text style={styles.title}>Welcome to{'\n'}EasyReads</Text>
          <Text style={styles.subtitle}>Your mindful reading companion</Text>

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Here's the magic:</Text>
            <View style={styles.heroSteps}>
              <View style={styles.heroStep}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="finger-print-outline" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.heroStepText}>Tap a{'\n'}word</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
              <View style={styles.heroStep}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="sparkles-outline" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.heroStepText}>Instant{'\n'}meaning</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
              <View style={styles.heroStep}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="bookmark-outline" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.heroStepText}>Saved to{'\n'}your list</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => transitionTo('demo')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Show me more</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {phase === 'demo' && (
        <Animated.View style={[styles.centered, { opacity: phaseFade, transform: [{ translateY: phaseSlide }] }]}>
          <View style={styles.demoIconWrap}>
            <Ionicons name="book" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.demoTitle}>Track your progress</Text>
          <Text style={styles.demoSubtitle}>
            Log pages daily, watch your streak grow, and let Smart Goals adjust to your pace.
          </Text>

          <View style={styles.miniFeatures}>
            <View style={styles.miniFeature}>
              <Ionicons name="flame" size={18} color="#F97316" />
              <Text style={styles.miniFeatureText}>Streak Protection</Text>
            </View>
            <View style={styles.miniFeature}>
              <Ionicons name="trending-up" size={18} color="#2563EB" />
              <Text style={styles.miniFeatureText}>Adaptive Goals</Text>
            </View>
            <View style={styles.miniFeature}>
              <Ionicons name="trophy" size={18} color="#D4A843" />
              <Text style={styles.miniFeatureText}>Milestones</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => transitionTo('preferences')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Personalize my experience</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {phase === 'preferences' && (
        <ScrollView
          contentContainerStyle={styles.prefScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: phaseFade, transform: [{ translateY: phaseSlide }] }}>
            <View style={styles.prefHeader}>
              <View style={styles.prefHeaderIcon}>
                <Ionicons name="options" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.prefTitle}>Quick Setup</Text>
              <Text style={styles.prefSubtitle}>2 quick questions so we can personalize your homepage</Text>
            </View>

            <Text style={styles.sectionLabel}>What do you want to improve?</Text>
            <Text style={styles.sectionHint}>Pick as many as you like</Text>
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map(opt => {
                const sel = selectedGoals.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.goalCard, sel && styles.goalCardSel]}
                    onPress={() => handleGoalToggle(opt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.goalIcon, sel && styles.goalIconSel]}>
                      <Ionicons name={opt.icon} size={18} color={sel ? '#FFF' : COLORS.accent} />
                    </View>
                    <Text style={[styles.goalLabel, sel && styles.goalLabelSel]}>{opt.label}</Text>
                    {sel && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>What do you usually read?</Text>
            <View style={styles.readingRow}>
              {READING_OPTIONS.map(opt => {
                const sel = selectedReading === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.readingPill, sel && styles.readingPillSel]}
                    onPress={() => setSelectedReading(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon} size={16} color={sel ? '#FFF' : COLORS.accent} />
                    <Text style={[styles.readingPillLabel, sel && styles.readingPillLabelSel]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.payoffBox}>
              <Text style={styles.payoffLabel}>Your homepage will be tailored to you</Text>
              <View style={styles.payoffRow}>
                {selectedGoals.slice(0, 3).map(g => (
                  <View key={g} style={styles.payoffTag}>
                    <Text style={styles.payoffTagText}>{g}</Text>
                  </View>
                ))}
                {selectedReading ? (
                  <View style={styles.payoffTag}>
                    <Text style={styles.payoffTagText}>{selectedReading}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !canFinish && styles.primaryBtnDisabled]}
              onPress={handleComplete}
              disabled={!canFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="rocket" size={18} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => transitionTo('demo')} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },

  chipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(74,124,89,0.1)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 28,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },

  logo: { width: 110, height: 110, borderRadius: 28, marginBottom: 20 },

  title: {
    fontSize: 30, fontWeight: '800', color: COLORS.text, textAlign: 'center',
    fontFamily: FONTS.serif, lineHeight: 38, letterSpacing: -0.4, marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: COLORS.mutedText, textAlign: 'center', marginBottom: 28 },

  heroCard: {
    width: '100%', backgroundColor: COLORS.white, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.border, padding: 20, marginBottom: 24,
  },
  heroLabel: { fontSize: 12, fontWeight: '700', color: COLORS.mutedText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  heroSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  heroStep: { alignItems: 'center', flex: 1 },
  heroIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(74,124,89,0.08)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  heroStepText: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center', lineHeight: 15 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 28, paddingVertical: 16, paddingHorizontal: 28,
    width: '100%', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  skipBtn: { paddingVertical: 14, marginTop: 4 },
  skipText: { fontSize: 14, color: COLORS.mutedText, textDecorationLine: 'underline' },

  demoIconWrap: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(74,124,89,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  demoTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif, marginBottom: 10 },
  demoSubtitle: { fontSize: 15, color: COLORS.mutedText, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  miniFeatures: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  miniFeature: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  miniFeatureText: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  prefScroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48 },
  prefHeader: { alignItems: 'center', marginBottom: 32 },
  prefHeaderIcon: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(74,124,89,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  prefTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif, marginBottom: 6 },
  prefSubtitle: { fontSize: 14, color: COLORS.mutedText, textAlign: 'center' },

  sectionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: COLORS.mutedText, marginBottom: 12 },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    padding: 14, position: 'relative',
  },
  goalCardSel: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  goalIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(74,124,89,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  goalIconSel: { backgroundColor: 'rgba(255,255,255,0.2)' },
  goalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  goalLabelSel: { color: '#FFF' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center',
  },

  readingRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  readingPill: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    paddingVertical: 14,
  },
  readingPillSel: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  readingPillLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  readingPillLabelSel: { color: '#FFF' },

  payoffBox: {
    marginTop: 24, backgroundColor: 'rgba(74,124,89,0.04)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(74,124,89,0.15)', padding: 14,
  },
  payoffLabel: { fontSize: 12, fontWeight: '600', color: COLORS.mutedText, marginBottom: 8 },
  payoffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  payoffTag: {
    backgroundColor: 'rgba(74,124,89,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  payoffTagText: { fontSize: 11, fontWeight: '600', color: COLORS.accent, textTransform: 'capitalize' },
});
