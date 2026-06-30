import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

type TabId = 'home' | 'analytics' | 'library' | 'profile';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { id: 'library', label: 'Library', icon: 'library-outline', iconActive: 'library' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

const TAB_IDS: TabId[] = ['home', 'analytics', 'library', 'profile'];

export const MainNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Sliding screens animation ref (horizontal slide)
  const slideX = useRef(new Animated.Value(0)).current;

  // Scale anims for tab icon bounce
  const scaleAnims = useRef<Record<TabId, Animated.Value>>(
    TABS.reduce((acc, t) => {
      acc[t.id] = new Animated.Value(1);
      return acc;
    }, {} as Record<TabId, Animated.Value>)
  ).current;

  // Active indicator position inside bottom pill
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = TAB_IDS.indexOf(activeTab);

    // Slide pages horizontally
    Animated.spring(slideX, {
      toValue: -index * width,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();

    // Slide indicator pill inside the tab bar
    Animated.spring(indicatorAnim, {
      toValue: index,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab, width]);

  const handleTabPress = (tabId: TabId) => {
    if (activeTab === tabId) return;

    // Bounce animation on tab icon
    Animated.sequence([
      Animated.timing(scaleAnims[tabId], {
        toValue: 0.75,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[tabId], {
        toValue: 1,
        friction: 3,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(tabId);
  };

  const pillWidth = Math.min(width * 0.8, 360);
  const tabWidth = (pillWidth - 20) / 4; // subtract pill padding

  return (
    <View style={styles.root}>
      {/* Sliding page container (Native feel transition) */}
      <View style={styles.screenArea}>
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              width: width * 4,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          {TAB_IDS.map((tabId) => (
            <View key={tabId} style={{ width, height: '100%' }}>
              {tabId === 'home' && <DashboardScreen />}
              {tabId === 'analytics' && <AnalyticsScreen />}
              {tabId === 'library' && <LibraryScreen />}
              {tabId === 'profile' && <ProfileScreen />}
            </View>
          ))}
        </Animated.View>
      </View>

      {/* iOS-style pill nav */}
      <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.pill, { width: pillWidth }]}>
          {/* Sliding active indicator behind icons */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                width: tabWidth,
                transform: [{
                  translateX: indicatorAnim.interpolate({
                    inputRange: [0, 1, 2, 3],
                    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
                  }),
                }],
              },
            ]}
          />
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navTab}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={1}
              >
                <Animated.View
                  style={[
                    styles.tabInner,
                    { transform: [{ scale: scaleAnims[tab.id] }] },
                  ]}
                >
                  <Ionicons
                    name={(isActive ? tab.iconActive : tab.icon) as any}
                    size={22}
                    color={isActive ? '#FFFFFF' : 'rgba(0, 0, 0, 0.42)'}
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenArea: {
    flex: 1,
    overflow: 'hidden',
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(240, 240, 240, 0.84)',
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    left: 10,
    bottom: 6,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
    minWidth: 64,
  },
});
