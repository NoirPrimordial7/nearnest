import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

type GoogleAuthEnv = {
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
};

declare const process: {
  env: GoogleAuthEnv;
};

const googleAuthEnv = {
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} satisfies GoogleAuthEnv;

function getEnvValue(key: keyof GoogleAuthEnv) {
  return googleAuthEnv[key]?.trim();
}

const webClientId = getEnvValue('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
const iosClientId = getEnvValue('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
const missingGoogleIdTokenMessage =
  'Google returned no ID token. Check Web OAuth client ID, Android package, and SHA fingerprints.';

GoogleSignin.configure({
  webClientId,
  iosClientId,
  scopes: ['openid', 'profile', 'email'],
});

export function getMissingGoogleSignInEnvKeys() {
  const missing: Array<keyof GoogleAuthEnv> = [];

  if (!getEnvValue('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID')) {
    missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  if (Platform.OS === 'android' && !getEnvValue('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID')) {
    missing.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  }

  if (Platform.OS === 'ios' && !getEnvValue('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID')) {
    missing.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }

  return missing;
}

export function getGoogleAuthUnavailableMessage() {
  const missing = getMissingGoogleSignInEnvKeys();

  if (missing.length > 0) {
    return `Google sign-in needs ${missing.join(
      ' and ',
    )}. Android OAuth must use package com.nearnest.medifind, and the EAS keystore SHA-1/SHA-256 must be added in Firebase/Google Cloud.`;
  }

  return '';
}

export function isGoogleSignInCancel(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === statusCodes.SIGN_IN_CANCELLED
  );
}

export function getGoogleNativeSignInErrorMessage(error: unknown) {
  if (isGoogleSignInCancel(error)) {
    return '';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
  ) {
    return 'Google Play Services is unavailable or out of date on this device.';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === statusCodes.IN_PROGRESS
  ) {
    return 'Google sign-in is already in progress.';
  }

  if (error instanceof Error && error.message === missingGoogleIdTokenMessage) {
    return error.message;
  }

  return 'Google sign-in failed. Check Web OAuth client ID, Android package com.nearnest.medifind, and EAS SHA-1/SHA-256 fingerprints in Firebase/Google Cloud.';
}

export async function getNativeGoogleIdToken() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const result = await GoogleSignin.signIn();

  if (result.type === 'cancelled') {
    return null;
  }

  if (!result.data.idToken) {
    throw new Error(missingGoogleIdTokenMessage);
  }

  return result.data.idToken;
}
