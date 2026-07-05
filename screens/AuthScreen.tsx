import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { signUpWithEmail, signInWithEmail } from '../services/firebase/emailAuthService';
import type { User } from 'firebase/auth';

const { width, height } = Dimensions.get('window');
const appLogo = require('../assets/logo.png');

interface AuthScreenProps {
  onAuthComplete: (isNewUser: boolean, firebaseUser: User) => void;
  onError: (message: string) => void;
  onToast?: (message: string, type: 'error' | 'success' | 'info') => void;
}

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete, onError, onToast }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const float1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(float1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    float1Loop.start();

    const float2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float2, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(float2, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    float2Loop.start();

    return () => {
      float1Loop.stop();
      float2Loop.stop();
    };
  }, []);

  const showError = (msg: string) => {
    setFieldError(msg);
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const clearError = () => {
    setFieldError('');
    errorAnim.setValue(0);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowPassword(false);
    clearError();
  };

  const switchMode = (newMode: AuthMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      resetForm();
      setMode(newMode);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSubmit = async () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 3, tension: 300, useNativeDriver: true }),
    ]).start();

    clearError();

    if (mode === 'signup') {
      if (!displayName.trim()) {
        showError('Please enter your name.');
        return;
      }
      if (!email.trim()) {
        showError('Please enter your email.');
        return;
      }
      if (!password) {
        showError('Please enter a password.');
        return;
      }
      if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
      }
    } else {
      if (!email.trim()) {
        showError('Please enter your email.');
        return;
      }
      if (!password) {
        showError('Please enter your password.');
        return;
      }
    }

    setLoading(true);
    try {
      let result;
      if (mode === 'signup') {
        result = await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        result = await signInWithEmail(email.trim(), password);
      }

      if (!result.success || !result.user) {
        const errorMsg = result.error || 'Authentication failed.';
        // Show as inline error AND toast
        showError(errorMsg);
        onToast?.(errorMsg, 'error');
        return;
      }

      // Show success toast
      if (result.isNewUser) {
        onToast?.('Account created successfully!', 'success');
      } else {
        onToast?.('Welcome back!', 'success');
      }

      onAuthComplete(!!result.isNewUser, result.user);
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred.';
      showError(errorMsg);
      onToast?.(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
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
          📖
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
          ✨
        </Animated.Text>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <Image source={appLogo} style={styles.appLogo} resizeMode="contain" />
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={styles.title}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Start your reading journey today.'
                : 'Log in to continue reading.'}
            </Text>
          </Animated.View>

          {/* Inline Error Banner */}
          {fieldError ? (
            <Animated.View style={[styles.errorBanner, { opacity: errorAnim }]}>
              <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
              <Text style={styles.errorBannerText}>{fieldError}</Text>
              <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Form */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              width: '100%',
            }}
          >
            {/* Name (signup only) */}
            {isSignup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={[styles.inputContainer, fieldError && fieldError.includes('name') && styles.inputError]}>
                  <Ionicons name="person-outline" size={18} color={COLORS.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={COLORS.mutedText}
                    value={displayName}
                    onChangeText={(t) => { setDisplayName(t); clearError(); }}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputContainer, fieldError && (fieldError.includes('email') || fieldError.includes('account') || fieldError.includes('Email')) && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.mutedText}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputContainer, fieldError && (fieldError.includes('password') || fieldError.includes('Password') || fieldError.includes('Incorrect')) && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.mutedText}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType={isSignup ? 'next' : 'done'}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.mutedText}
                  />
                </TouchableOpacity>
              </View>
              {fieldError && fieldError.includes('at least 6') && (
                <Text style={styles.fieldErrorHint}>Must be at least 6 characters</Text>
              )}
            </View>

            {/* Confirm Password (signup only) */}
            {isSignup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={[styles.inputContainer, fieldError && fieldError.includes('match') && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={COLORS.mutedText}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading
                    ? isSignup
                      ? 'Creating Account...'
                      : 'Logging in...'
                    : isSignup
                      ? 'Sign Up'
                      : 'Log In'}
                </Text>
                {!loading && (
                  <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Switch mode */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={() => switchMode(isSignup ? 'login' : 'signup')}>
                <Text style={styles.switchLink}>
                  {isSignup ? ' Log In' : ' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://easyreads.app/terms')}
              accessibilityRole="link"
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://easyreads.app/privacy')}
              accessibilityRole="link"
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  fieldErrorHint: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    paddingVertical: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  switchText: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  termsContainer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  float1: {
    top: height * 0.1,
    left: width * 0.1,
  },
  float2: {
    top: height * 0.2,
    right: width * 0.08,
  },
});
