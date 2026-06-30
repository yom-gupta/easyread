import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReadingProvider } from './context/ReadingContext';
import { MainNavigator } from './navigation/MainNavigator';
import { OnboardingScreen } from './screens/OnboardingScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <SafeAreaProvider>
      <ReadingProvider>
        {showOnboarding ? (
          <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        ) : (
          <MainNavigator />
        )}
      </ReadingProvider>
    </SafeAreaProvider>
  );
}
