import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { haptics } from '../utils/haptics';
import { useAndroidBack } from '../utils/useAndroidBack';
import {
  ReminderSettings,
  ReminderTone,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  scheduleDaily,
  previewCopy,
} from '../services/notifications';
import { analytics, EVENTS } from '../services/analytics';

interface Props {
  onClose: () => void;
}

const TONES: { id: ReminderTone; label: string; emoji: string; sample: string }[] = [
  { id: 'gentle',       label: 'Gentle',       emoji: '🕯️', sample: 'Soft, calming, no pressure.' },
  { id: 'cheeky',       label: 'Cheeky',       emoji: '😏', sample: 'A little sass. A lot of personality.' },
  { id: 'competitive',  label: 'Streak-mode',  emoji: '🔥', sample: 'Straight-up, keep-the-flame-alive vibes.' },
];

const QUICK_TIMES = [
  { label: 'Morning coffee', hour: 8,  minute: 0,  emoji: '☕' },
  { label: 'Lunch break',    hour: 13, minute: 0,  emoji: '🥪' },
  { label: 'Wind-down',      hour: 20, minute: 30, emoji: '🌙' },
  { label: 'Late night',     hour: 22, minute: 30, emoji: '🌌' },
];

const fmtTime = (h: number, m: number) => {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
};

export const NotificationsScreen: React.FC<Props> = ({ onClose }) => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [preview, setPreview] = useState(previewCopy(DEFAULT_SETTINGS.tone));
  const previewOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSettings().then(s => {
      setSettings(s);
      setPreview(previewCopy(s.tone));
    });
  }, []);

  // Hardware back on Android closes the screen instead of quitting the app.
  useAndroidBack(() => { onClose(); }, true);

  const cyclePreview = (tone: ReminderTone) => {
    Animated.timing(previewOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setPreview(previewCopy(tone));
      Animated.timing(previewOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const applyAndSchedule = async (next: ReminderSettings) => {
    setSettings(next);
    await saveSettings(next);
    await scheduleDaily(next);
  };

  const toggle = async (enabled: boolean) => {
    haptics.tapMedium();
    const next = { ...settings, enabled };
    analytics.logEvent(EVENTS.notifications_enable, { enabled });
    applyAndSchedule(next);
  };

  const pickTone = (tone: ReminderTone) => {
    haptics.select();
    cyclePreview(tone);
    analytics.logEvent(EVENTS.notifications_tone, { tone });
    applyAndSchedule({ ...settings, tone });
  };

  const pickTime = (hour: number, minute: number) => {
    haptics.select();
    applyAndSchedule({ ...settings, hour, minute });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => { haptics.tapLight(); onClose(); }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.topTitle}>Reminders</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero preview — Zomato-style playful card */}
        <View style={styles.previewCard}>
          <View style={styles.previewIcon}>
            <Text style={{ fontSize: 26 }}>📖</Text>
          </View>
          <Animated.View style={{ opacity: previewOpacity, flex: 1 }}>
            <Text style={styles.previewApp}>EasyReads · now</Text>
            <Text style={styles.previewTitle}>{preview.title}</Text>
            <Text style={styles.previewBody}>{preview.body}</Text>
          </Animated.View>
        </View>
        <Pressable
          style={styles.shuffleRow}
          onPress={() => { haptics.tapLight(); cyclePreview(settings.tone); }}
        >
          <Ionicons name="shuffle" size={14} color={COLORS.mutedText} />
          <Text style={styles.shuffleText}>Shuffle preview</Text>
        </Pressable>

        {/* Master switch */}
        <View style={styles.masterCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>Daily reading nudge</Text>
            <Text style={styles.masterHint}>
              One reminder, once a day. Off by default. On when you say so.
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={toggle}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={Platform.OS === 'android' ? COLORS.white : undefined}
          />
        </View>

        {settings.enabled && (
          <>
            {/* Tone picker */}
            <Text style={styles.sectionLabel}>Pick your vibe</Text>
            <View style={styles.toneList}>
              {TONES.map(t => {
                const selected = settings.tone === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => pickTone(t.id)}
                    style={[styles.toneCard, selected && styles.toneCardSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t.label} tone`}
                  >
                    <Text style={styles.toneEmoji}>{t.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toneLabel}>{t.label}</Text>
                      <Text style={styles.toneHint}>{t.sample}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? COLORS.accent : COLORS.border}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Time picker — quick presets */}
            <Text style={styles.sectionLabel}>When?</Text>
            <View style={styles.currentTimeCard}>
              <Ionicons name="alarm-outline" size={20} color={COLORS.accent} />
              <Text style={styles.currentTimeText}>
                Currently: <Text style={styles.currentTimeBold}>{fmtTime(settings.hour, settings.minute)}</Text> every day
              </Text>
            </View>
            <View style={styles.timeGrid}>
              {QUICK_TIMES.map(t => {
                const selected = settings.hour === t.hour && settings.minute === t.minute;
                return (
                  <Pressable
                    key={t.label}
                    onPress={() => pickTime(t.hour, t.minute)}
                    style={[styles.timeChip, selected && styles.timeChipSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.label} ${fmtTime(t.hour, t.minute)}`}
                  >
                    <Text style={styles.timeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.timeLabel, selected && styles.timeLabelSelected]}>
                      {t.label}
                    </Text>
                    <Text style={[styles.timeSub, selected && styles.timeSubSelected]}>
                      {fmtTime(t.hour, t.minute)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Info footer */}
            <View style={styles.footer}>
              <Ionicons name="sparkles-outline" size={14} color={COLORS.mutedText} />
              <Text style={styles.footerText}>
                We rotate the message every day so it never feels robotic.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
  topTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },

  previewCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(74,124,89,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewApp: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: FONTS.medium,
  },
  previewBody: { fontSize: 14, color: COLORS.text, lineHeight: 19 },

  shuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  shuffleText: { fontSize: 12, color: COLORS.mutedText },

  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: FONTS.medium,
  },
  masterHint: { fontSize: 13, color: COLORS.mutedText, lineHeight: 18 },

  sectionLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 1.5,
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  toneList: { gap: 10, marginBottom: SPACING.md },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  toneCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,124,89,0.06)',
  },
  toneEmoji: { fontSize: 22 },
  toneLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.medium },
  toneHint: { fontSize: 12, color: COLORS.mutedText, marginTop: 2 },

  currentTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.bannerBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.bannerBorder,
    marginBottom: SPACING.md,
  },
  currentTimeText: { fontSize: 13, color: COLORS.text, flex: 1 },
  currentTimeBold: { fontWeight: '700' },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    flexBasis: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'flex-start',
  },
  timeChipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,124,89,0.06)',
  },
  timeEmoji: { fontSize: 22, marginBottom: 6 },
  timeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.medium },
  timeLabelSelected: { color: COLORS.accent },
  timeSub: { fontSize: 12, color: COLORS.mutedText, marginTop: 2 },
  timeSubSelected: { color: COLORS.accent },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    justifyContent: 'center',
  },
  footerText: { fontSize: 12, color: COLORS.mutedText },
});
