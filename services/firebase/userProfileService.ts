import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../config/firebase';
import type { UserProfile } from '../../context/ReadingContext';

export interface UserProfileData {
  email: string;
  displayName: string;
  dateOfBirth: string; // ISO date string YYYY-MM-DD
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  authProvider: 'google' | 'email';
  photoURL?: string;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export async function createUserProfile(
  uid: string,
  profileData: UserProfileData,
): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not configured');

  const userProfile: UserProfile = {
    uid,
    email: profileData.email,
    displayName: profileData.displayName,
    dateOfBirth: profileData.dateOfBirth,
    age: profileData.age,
    gender: profileData.gender,
    authProvider: profileData.authProvider,
    photoURL: profileData.photoURL,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    onboardingCompleted: false,
    
    // Reading stats
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: '',
    streakFreezeAvailable: 3,
    streakFreezeUsedToday: false,
    rollingPageAverage: 10,
    baselineGoal: 15,
    currentGoal: 15,
    totalXP: 0,
    level: 1,
    achievements: [],
    totalPagesRead: 0,
    totalBooksFinished: 0,
    vocabSharedCount: 0,
    consecutiveGoalDays: 0,
  };

  await setDoc(doc(db, 'users', uid), userProfile);
  return userProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;

  return { uid, ...docSnap.data() } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not configured');

  // Recalculate age if DOB is updated
  if (updates.dateOfBirth) {
    updates.age = calculateAge(updates.dateOfBirth);
  }

  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    lastLoginAt: new Date().toISOString(),
  });
}

export async function markOnboardingComplete(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not configured');

  await updateDoc(doc(db, 'users', uid), {
    onboardingCompleted: true,
  });
}

export { calculateAge };

export async function checkUserProfileExists(uid: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists();
}
