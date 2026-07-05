import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const appLogo = require('../assets/logo.png');

export const LoadingScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Animated.Image
            source={appLogo}
            style={[styles.logo, { opacity: fadeAnim }]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>EasyReads</Text>
        <Text style={styles.tagline}>Your mindful reading companion</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  loadingContainer: {
    width: 240,
    height: 80,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


