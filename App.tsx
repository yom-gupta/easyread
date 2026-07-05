import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { ReadingProvider, useReading } from './context/ReadingContext';

// Keep splash visible until we know the auth + onboarding state so users
// never see a blank frame before the first real screen. Safe to call at
// module load — fails silently in dev-reload or web.
SplashScreen.preventAutoHideAsync().catch(() => {});
import { MainNavigator } from './navigation/MainNavigator';
import { OnboardingScreen } from './screens/OnboardingScreen';
import type { OnboardingPreferences } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SignUpFormScreen } from './screens/SignUpFormScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { DynamicIslandToast } from './components/DynamicIslandToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { User } from 'firebase/auth';
import { analytics, EVENTS } from './services/analytics';

type AuthFlowState = 'loading' | 'onboarding' | 'auth' | 'signup' | 'app';

function AppContent() {
  const readingContext = useReading();
  const [flowState, setFlowState] = useState<AuthFlowState>('loading');
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');
  const [signupData, setSignupData] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [onboardingPrefs, setOnboardingPrefs] = useState<OnboardingPreferences | null>(null);

  const { authUser, authLoading, updateGoal } = readingContext || {};

  // Once the user completes onboarding AND is authenticated, seed the daily goal
  // from the picked target. Only fire once per pending prefs object.
  useEffect(() => {
    if (!onboardingPrefs || !authUser || !updateGoal) return;
    if (onboardingPrefs.dailyPageTarget > 0) {
      updateGoal(onboardingPrefs.dailyPageTarget);
    }
    setOnboardingPrefs(null);
  }, [onboardingPrefs, authUser, updateGoal]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('onboarding_seen_v4');
        setOnboardingSeen(seen === 'true');
      } catch {
        setOnboardingSeen(false);
      }
    };
    checkOnboarding();
  }, []);

  // Hide the splash screen the moment we can render a real screen.
  useEffect(() => {
    if (!authLoading && onboardingSeen !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, onboardingSeen]);

  // Route on primitives only. Depending on the whole context object caused
  // spurious re-runs (new object every render) and flashes of AuthScreen.
  useEffect(() => {
    if (authLoading || onboardingSeen === null) return;

    if (!onboardingSeen) {
      setFlowState('onboarding');
      return;
    }

    setFlowState(prev => {
      // Preserve mid-flight signup so a token blip doesn't drop us out.
      if (prev === 'signup') return prev;
      if (!authUser) return 'auth';
      return 'app';
    });
  }, [authUser, authLoading, onboardingSeen]);

  useEffect(() => {
    if (flowState === 'loading') return;
    analytics.screen(flowState);
  }, [flowState]);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleAuthComplete = (isNewUser: boolean, firebaseUser: User) => {
    analytics.setUserId(firebaseUser.uid);
    analytics.logEvent(isNewUser ? EVENTS.auth_signup : EVENTS.auth_login);
    if (isNewUser) {
      setSignupData({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
      });
      setFlowState('signup');
    } else {
      setFlowState('app');
    }
  };

  const handleOnboardingComplete = async (prefs: OnboardingPreferences) => {
    try {
      await AsyncStorage.setItem('onboarding_seen_v4', 'true');
      await AsyncStorage.setItem('onboarding_prefs', JSON.stringify(prefs));
    } catch {}
    analytics.logEvent(
      prefs.onboardingSkipped ? EVENTS.onboarding_skip : EVENTS.onboarding_complete,
      {
        reading_goal: prefs.readingGoal || 'none',
        daily_page_target: prefs.dailyPageTarget || 0,
      },
    );
    if (prefs.readingGoal) analytics.setUserProperty('reading_goal', prefs.readingGoal);
    setOnboardingPrefs(prefs);
    setOnboardingSeen(true);
    setFlowState('auth');
  };

  const handleSignupComplete = () => {
    setFlowState('app');
  };

  let content: React.ReactNode;

  if (flowState === 'loading') {
    content = <LoadingScreen />;
  } else if (flowState === 'onboarding') {
    content = <OnboardingScreen onComplete={handleOnboardingComplete} />;
  } else if (flowState === 'auth') {
    content = (
      <AuthScreen
        onAuthComplete={handleAuthComplete}
        onError={(msg) => showToast(msg, 'error')}
        onToast={(msg, type) => showToast(msg, type)}
      />
    );
  } else if (flowState === 'signup' && signupData) {
    content = (
      <SignUpFormScreen
        uid={signupData.uid}
        defaultDisplayName={signupData.name}
        defaultEmail={signupData.email}
        onComplete={handleSignupComplete}
        onError={(msg) => showToast(msg, 'error')}
      />
    );
  } else {
    content = <MainNavigator />;
  }

  return (
    <>
      {content}
      <DynamicIslandToast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ReadingProvider>
          <AppContent />
        </ReadingProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
