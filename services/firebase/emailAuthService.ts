import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../../config/firebase';

export interface EmailAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  isNewUser?: boolean;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<EmailAuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set display name on Firebase Auth
    await updateProfile(user, { displayName });

    // Save basic profile to Firestore immediately
    const db = getFirebaseDb();
    if (!db) {
      // Firestore not available — profile will sync on first data change
    } else {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email,
          displayName,
          authProvider: 'email',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          onboardingCompleted: false,
          currentStreak: 0,
          longestStreak: 0,
          lastReadDate: '',
          streakFreezeAvailable: 2,
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
        }, { merge: true });
        } catch {
          // Failed to save profile to Firestore — will sync on first data change
        }
    }

    return { success: true, user, isNewUser: true };
  } catch (err: any) {
    const code = err.code;
    if (code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email is already registered. Try logging in.' };
    }
    if (code === 'auth/invalid-email') {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (code === 'auth/weak-password') {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    return { success: false, error: err.message || 'Sign up failed.' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<EmailAuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user, isNewUser: false };
  } catch (err: any) {
    const code = err.code;
    if (code === 'auth/user-not-found') {
      return { success: false, error: 'No account found with this email.' };
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return { success: false, error: 'Incorrect email or password.' };
    }
    if (code === 'auth/invalid-email') {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (code === 'auth/too-many-requests') {
      return { success: false, error: 'Too many attempts. Please try again later.' };
    }
    return { success: false, error: err.message || 'Login failed.' };
  }
}
