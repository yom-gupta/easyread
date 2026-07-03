import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingProvider, useReading } from './context/ReadingContext';
import { MainNavigator } from './navigation/MainNavigator';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SignUpFormScreen } from './screens/SignUpFormScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { DynamicIslandToast } from './components/DynamicIslandToast';
import type { User } from 'firebase/auth';

type AuthFlowState = 'loading' | 'onboarding' | 'auth' | 'signup' | 'app';

function AppContent() {
  const { authUser, authLoading } = useReading();
  const [flowState, setFlowState] = useState<AuthFlowState>('loading');
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');
  const [signupData, setSignupData] = useState<{ uid: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const migrated = await AsyncStorage.getItem('onboarding_migrated_v2');
        if (!migrated) {
          await AsyncStorage.removeItem('onboarding_seen');
          await AsyncStorage.setItem('onboarding_migrated_v2', 'true');
          setOnboardingSeen(false);
          return;
        }
        const seen = await AsyncStorage.getItem('onboarding_seen');
        setOnboardingSeen(seen === 'true');
      } catch {
        setOnboardingSeen(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (authLoading || onboardingSeen === null) return;

    if (!onboardingSeen) {
      setFlowState('onboarding');
      return;
    }

    if (!authUser) {
      setFlowState('auth');
    } else if (flowState !== 'signup') {
      setFlowState('app');
    }
  }, [authUser, authLoading, onboardingSeen, flowState]);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleAuthComplete = (isNewUser: boolean, firebaseUser: User) => {
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

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_seen', 'true');
    } catch {}
    setOnboardingSeen(true);
    setFlowState('auth');
  };

  const handleSignupComplete = () => {
    setFlowState('app');
  };

  if (flowState === 'loading') {
    return <LoadingScreen />;
  }

  if (flowState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (flowState === 'auth' || !authUser) {
    return (
      <AuthScreen
        onAuthComplete={handleAuthComplete}
        onError={(msg) => showToast(msg, 'error')}
        onToast={(msg, type) => showToast(msg, type)}
      />
    );
  }

  if (flowState === 'signup' && signupData) {
    return (
      <SignUpFormScreen
        uid={signupData.uid}
        defaultDisplayName={signupData.name}
        defaultEmail={signupData.email}
        onComplete={handleSignupComplete}
        onError={(msg) => showToast(msg, 'error')}
      />
    );
  }

  return (
    <>
      <MainNavigator />
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
    <SafeAreaProvider>
      <ReadingProvider>
        <AppContent />
      </ReadingProvider>
    </SafeAreaProvider>
  );
}
