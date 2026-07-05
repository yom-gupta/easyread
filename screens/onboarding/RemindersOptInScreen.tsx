import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { haptics } from './haptics';
import {
  requestPermission,
  scheduleDaily,
  saveSettings,
  DEFAULT_SETTINGS,
  ReminderTone,
  previewCopy,
} from '../../services/notifications';
import { analytics, EVENTS } from '../../services/analytics';

interface Props {
  onDone: () => void;
}

const TONES: { id: ReminderTone; label: string; emoji: string }[] = [
  { id: 'gentle',      label: 'Gentle',     emoji: '🕯️' },
  { id: 'cheeky',      label: 'Cheeky',     emoji: '😏' },
  { id: 'competitive', label: 'Streak',     emoji: '🔥' },
];

export const RemindersOptInScreen: React.FC<Props> = ({ onDone }) => {
  const [tone, setTone] = useState<ReminderTone>('cheeky');
  const [preview, setPreview] = useState(previewCopy('cheeky'));
  const [busy, setBusy] = useState(false);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const bell = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const wobble = Animated.loop(
      Animated.sequence([
        Animated.timing(bell, { toValue: 1,  duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bell, { toValue: -1, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bell, { toValue: 0,  duration: 200, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(2400),
      ]),
    );
    wobble.start();
    return () => wobble.stop();
  }, [bell]);

  const bellRotate = bell.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });

  const cyclePreview = (next: ReminderTone) => {
    Animated.timing(cardOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setPreview(previewCopy(next));
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const pickTone = (next: ReminderTone) => {
    haptics.select();
    setTone(next);
    analytics.logEvent(EVENTS.notifications_tone, { tone: next, source: 'onboarding' });
    cyclePreview(next);
  };

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    haptics.tapMedium();
    const granted = await requestPermission();
    if (granted) {
      const settings = { ...DEFAULT_SETTINGS, enabled: true, tone };
      await saveSettings(settings);
      await scheduleDaily(settings);
      analytics.logEvent(EVENTS.notifications_enable, { enabled: true, source: 'onboarding' });
      haptics.success();
    } else {
      // Store the tone anyway so if they enable from Profile later, we honour it.
      await saveSettings({ ...DEFAULT_SETTINGS, enabled: false, tone });
      haptics.warning();
    }
    setBusy(false);
    onDone();
  };

  const skip = () => {
    haptics.tapLight();
    onDone();
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Animated.View
          style={[
            styles.bellWrap,
            { transform: [{ rotate: bellRotate }] },
          ]}
        >
          <Ionicons name="notifications" size={40} color={COLORS.accent} />
        </Animated.View>

        <Text style={styles.title}>Want a nudge each day?</Text>
        <Text style={styles.subtitle}>
          One tiny reminder. Zero spam. Change or turn it off anytime.
        </Text>

        {/* Preview card — mimics a real push notification */}
        <Animated.View style={[styles.previewCard, { opacity: cardOpacity }]}>
          <View style={styles.previewIcon}><Text style={{ fontSize: 20 }}>📖</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewApp}>EasyReads · now</Text>
            <Text style={styles.previewTitle} numberOfLines={1}>{preview.title}</Text>
            <Text style={styles.previewBody} numberOfLines={2}>{preview.body}</Text>
          </View>
        </Animated.View>

        {/* Tone chips */}
        <View style={styles.tones}>
          {TONES.map(t => {
            const selected = tone === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => pickTone(t.id)}
                style={[styles.toneChip, selected && styles.toneChipSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t.label} tone`}
              >
                <Text style={styles.toneEmoji}>{t.emoji}</Text>
                <Text style={[styles.toneLabel, selected && styles.toneLabelSelected]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: SPACING.md }}>
        <PrimaryButton
          label={busy ? 'Setting up…' : 'Turn on reminders'}
          icon="notifications-outline"
          onPress={enable}
          disabled={busy}
        />
        <Pressable onPress={skip} accessibilityRole="button">
          <Text style={styles.skipText}>Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', gap: SPACING.md, paddingTop: SPACING.md },
  bellWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74,124,89,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.mutedText,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: SPACING.md,
  },
  previewCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(74,124,89,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewApp: { fontSize: 11, color: COLORS.mutedText, fontFamily: FONTS.medium, marginBottom: 2 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  previewBody: { fontSize: 13, color: COLORS.text, lineHeight: 18 },

  tones: { flexDirection: 'row', gap: 10, marginTop: SPACING.sm },
  toneChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
  },
  toneChipSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(74,124,89,0.08)' },
  toneEmoji: { fontSize: 18 },
  toneLabel: { fontSize: 12, color: COLORS.mutedText, fontFamily: FONTS.medium, fontWeight: '600' },
  toneLabelSelected: { color: COLORS.accent },

  skipText: {
    textAlign: 'center',
    color: COLORS.mutedText,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
