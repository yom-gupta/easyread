import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';

const appLogo = require('../../assets/logo.png');

interface Props {
  onNext: () => void;
  onSignIn: () => void;
}

export const HookScreen: React.FC<Props> = ({ onNext, onSignIn }) => {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(contentY, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, []);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: floatY }],
          }}
        >
          <View style={styles.logoRing}>
            <Image source={appLogo} style={styles.logo} />
          </View>
        </Animated.View>

        <Animated.View
          style={{ opacity: contentOpacity, transform: [{ translateY: contentY }], alignItems: 'center' }}
        >
          <Text style={styles.eyebrow}>EasyReads</Text>
          <Text style={styles.title}>Read a little.{'\n'}Every day.</Text>
          <Text style={styles.subtitle}>
            Track pages, save words, build a streak. No pressure — just the reading habit you keep coming back to.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }], width: '100%' }}>
        <PrimaryButton label="Get started" icon="arrow-forward" onPress={onNext} />
        <View style={{ height: SPACING.md }} />
        <PrimaryButton label="I already have an account" variant="ghost" onPress={onSignIn} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: { width: 72, height: 72, resizeMode: 'contain' },
  eyebrow: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    letterSpacing: 3,
    color: COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.mutedText,
    textAlign: 'center',
    maxWidth: 320,
  },
});
