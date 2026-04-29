import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type NextOrObserver,
  type User,
} from 'firebase/auth';

import { auth } from './firebase';
import { refreshEmailVerifiedField, upsertUserProfileFromAuthUser } from './userProfile';

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await upsertUserProfileFromAuthUser(result.user, 'password');
  return result;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

  const trimmedName = displayName?.trim();
  if (trimmedName) {
    try {
      await updateProfile(result.user, { displayName: trimmedName });
    } catch (error) {
      // Auth-profile updates are non-fatal; we'll fall back to the Firestore upsert default.
      if (__DEV__) {
        console.warn('updateProfile(displayName) failed:', error);
      }
    }
  }

  await upsertUserProfileFromAuthUser(result.user, 'password', { displayName: trimmedName });

  try {
    await sendEmailVerification(result.user);
  } catch (error) {
    // We do not want a verification-send failure to take down sign-up.
    // The Verify Email screen has a manual resend path.
    if (__DEV__) {
      console.warn('Verification email send failed:', error);
    }
  }

  return result;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await upsertUserProfileFromAuthUser(result.user, GoogleAuthProvider.PROVIDER_ID);
  return result;
}

export async function signInWithGoogleAccessToken(accessToken: string) {
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(auth, credential);
  await upsertUserProfileFromAuthUser(result.user, GoogleAuthProvider.PROVIDER_ID);
  return result;
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function subscribeToAuthState(observer: NextOrObserver<User>) {
  return onAuthStateChanged(auth, observer);
}

export function sendVerificationEmailToCurrentUser() {
  if (!auth.currentUser) {
    throw new Error('No signed-in user.');
  }

  return sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser() {
  if (!auth.currentUser) {
    return null;
  }

  await reload(auth.currentUser);

  if (auth.currentUser) {
    await refreshEmailVerifiedField(auth.currentUser);
  }

  return auth.currentUser;
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
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
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable it in Firebase Authentication.';
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not authorized for this app yet. Check Firebase Auth settings.';
    case 'auth/network-request-failed':
      return 'We could not reach Firebase. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/api-key-not-valid':
      return 'Firebase Auth is missing valid mobile config. Check apps/mobile/.env and restart Expo.';
    case 'auth/missing-email':
      return 'Enter an email address first.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    default:
      return 'We could not complete this action. Try again.';
  }
}
