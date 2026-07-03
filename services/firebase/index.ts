export { isFirebaseConfigured, getFirebaseApp, getFirebaseAuth, getFirebaseDb } from '../../config/firebase';
export { waitForAuthUser, signOut, onAuthStateChange } from './authService';
export { signInWithGoogle } from './googleAuthService';
export {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  checkUserProfileExists,
  calculateAge,
  type UserProfileData,
} from './userProfileService';
export {
  loadReadingData,
  saveReadingData,
  type ReadingData,
} from './readingDataService';
