import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChecklistItem {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  onDismiss: () => void;
}

const CHECKLIST_KEY = 'onboarding_checklist_v1';

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'add_book', label: 'Add your first book', icon: 'book-outline', completed: false },
  { id: 'log_pages', label: 'Log today\'s pages', icon: 'document-text-outline', completed: false },
  { id: 'lookup_word', label: 'Look up a word', icon: 'search-outline', completed: false },
  { id: 'save_word', label: 'Save a word to notebook', icon: 'bookmark-outline', completed: false },
  { id: 'three_day_streak', label: 'Hit a 3-day streak', icon: 'flame-outline', completed: false },
];

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ onDismiss }) => {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [dismissed, setDismissed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadChecklist();
  }, []);

  useEffect(() => {
    if (!dismissed) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [dismissed]);

  const loadChecklist = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHECKLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChecklistItem[];
        setItems(parsed);
        const allDone = parsed.every(i => i.completed);
        if (allDone || parsed.length === 0) {
          setDismissed(true);
        }
      }
    } catch {}
  };

  const saveChecklist = async (newItems: ChecklistItem[]) => {
    try {
      await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(newItems));
    } catch {}
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    saveChecklist(newItems);
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDismissed(true);
      onDismiss();
    });
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = completedCount / items.length;

  if (dismissed) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="rocket" size={16} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Getting Started</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={COLORS.mutedText} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{completedCount} of {items.length} done</Text>

      <View style={styles.items}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, item.completed && styles.itemCompleted]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Ionicons name="checkmark" size={12} color="#FFF" />}
            </View>
            <Ionicons
              name={item.icon as any}
              size={16}
              color={item.completed ? COLORS.accent : COLORS.mutedText}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.itemLabel, item.completed && styles.itemLabelCompleted]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '500',
    marginBottom: 12,
  },
  items: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemCompleted: {
    backgroundColor: 'rgba(74,124,89,0.04)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  itemLabelCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.mutedText,
  },
});
