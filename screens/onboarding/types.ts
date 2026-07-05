export type ReadingGoal = 'vocabulary' | 'speed' | 'comprehension' | 'habit';

export interface OnboardingPreferences {
  readingGoal: ReadingGoal | null;
  dailyPageTarget: number;
  onboardingSkipped: boolean;
  // Kept for back-compat with old handleOnboardingComplete signature.
  goals?: string[];
  preferredReading?: string;
}
