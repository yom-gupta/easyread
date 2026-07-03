import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../../config/firebase';
import type { User } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
// Falls back to webClientId so Expo Go on Android/iOS still works without native client IDs.
// For production builds, set proper platform-specific IDs in .env.
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

export interface GoogleAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  isNewUser?: boolean;
}

import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: Platform.select({
      web: Linking.createURL('/'),
      default: undefined,
    }),
  });

  return { request, response, promptAsync };
}

export async function signInWithGoogle(idToken: string): Promise<GoogleAuthResult> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: 'Firebase not configured' };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    const isNewUser =
      userCredential.user.metadata.creationTime ===
      userCredential.user.metadata.lastSignInTime;

    return {
      success: true,
      user: userCredential.user,
      isNewUser,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await auth.signOut();
  }
}
