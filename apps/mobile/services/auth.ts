import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type NextOrObserver,
  type User,
} from 'firebase/auth';

import { auth } from './firebase';

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function subscribeToAuthState(observer: NextOrObserver<User>) {
  return onAuthStateChanged(auth, observer);
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'We could not complete this action. Try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Sign in instead.';
    case 'auth/weak-password':
      return 'Use at least 8 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists for this email. Sign in with the original method first.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable it in Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'We could not reach Firebase. Check your connection and try again.';
    case 'auth/api-key-not-valid':
      return 'Firebase Auth is missing valid mobile config. Check apps/mobile/.env and restart Expo.';
    default:
      return 'We could not complete this action. Try again.';
  }
}
