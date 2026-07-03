import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export const DynamicIslandToast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  visible,
  onHide,
  duration = 3000,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide down and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timeout = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const iconName = type === 'error' ? 'alert-circle' : type === 'success' ? 'checkmark-circle' : 'information-circle';
  const iconColor = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#3B82F6';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Platform.OS === 'ios' ? insets.top + 10 : 20,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.toast, { borderLeftColor: iconColor }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width - 40,
    borderLeftWidth: 4,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});
