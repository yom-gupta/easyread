import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../../config/firebase';

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function waitForAuthUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return Promise.resolve(null);

  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;

  await firebaseSignOut(auth);
}
