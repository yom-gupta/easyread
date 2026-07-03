import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface SignUpFormScreenProps {
  uid: string;
  defaultDisplayName: string;
  defaultEmail: string;
  onComplete: () => void;
  onError: (message: string) => void;
}

export const SignUpFormScreen: React.FC<SignUpFormScreenProps> = ({
  uid,
  defaultDisplayName,
  defaultEmail,
  onComplete,
  onError,
}) => {
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      onError('Please enter your name.');
      return;
    }

    setLoading(true);
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 3, tension: 300, useNativeDriver: true }),
    ]).start();

    try {
      await new Promise(r => setTimeout(r, 800));

      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      await new Promise(r => setTimeout(r, 600));
      onComplete();
    } catch (err: any) {
      onError(err.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={32} color="#FFF" />
            </View>
          </Animated.View>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Just one thing — what should we call you?
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Your name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.mutedText} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.mutedText}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              {displayName.trim().length > 0 && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
              )}
            </View>
          </View>

          <View style={styles.emailPreview}>
            <Ionicons name="mail-outline" size={16} color={COLORS.mutedText} />
            <Text style={styles.emailText}>{defaultEmail}</Text>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitBtnText}>Setting up...</Text>
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Start Reading</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.welcomeNote}>
          <Ionicons name="heart" size={14} color={COLORS.accent} />
          <Text style={styles.welcomeNoteText}>
            Welcome aboard! Your reading journey starts now.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },

  progressTrack: {
    height: 3, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2,
    marginBottom: 40, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },

  header: { alignItems: 'center', marginBottom: 36 },
  checkCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.serif,
    marginBottom: 8, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, color: COLORS.mutedText, textAlign: 'center', lineHeight: 22,
  },

  form: { marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 14, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text, padding: 0 },

  emailPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(74,124,89,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  emailText: { flex: 1, fontSize: 13, color: COLORS.mutedText, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 28, paddingVertical: 16,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  welcomeNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16,
  },
  welcomeNoteText: { fontSize: 13, color: COLORS.mutedText, fontStyle: 'italic' },
});
