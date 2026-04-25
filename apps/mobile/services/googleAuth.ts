import * as Google from 'expo-auth-session/providers/google';
import type { AuthSessionResult } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthEnv = {
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
};

declare const process: {
  env: GoogleAuthEnv;
};

const googleEnvKeys = {
  android: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  ios: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  web: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
} as const;

function getEnvValue(key: keyof GoogleAuthEnv) {
  return process.env[key]?.trim();
}

export function getGoogleAuthRequestConfig(): Partial<Google.GoogleAuthRequestConfig> {
  const webClientId = getEnvValue('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  const androidClientId = getEnvValue('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  const iosClientId = getEnvValue('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');

  return {
    webClientId,
    androidClientId,
    iosClientId,
    clientId: androidClientId ?? iosClientId ?? webClientId ?? 'missing-google-client-id',
    selectAccount: true,
  };
}

export function getMissingGoogleAuthEnvKeys() {
  const requiredKey = Platform.select({
    android: googleEnvKeys.android,
    ios: googleEnvKeys.ios,
    default: googleEnvKeys.web,
  });

  const missing: Array<keyof GoogleAuthEnv> = [googleEnvKeys.web];

  if (requiredKey && requiredKey !== googleEnvKeys.web) {
    missing.push(requiredKey);
  }

  return missing.filter((key) => !getEnvValue(key));
}

export function hasGoogleAuthConfig() {
  return getMissingGoogleAuthEnvKeys().length === 0;
}

export function getGoogleAuthUnavailableMessage() {
  if (Constants.appOwnership === 'expo') {
    return 'Google sign-in needs a Medifind development build. Expo Go cannot complete this OAuth redirect reliably.';
  }

  const missing = getMissingGoogleAuthEnvKeys();

  if (missing.length > 0) {
    return `Google sign-in needs ${missing.join(' and ')} in apps/mobile/.env. Restart Expo after adding it.`;
  }

  return '';
}

export function getGoogleAuthResultMessage(result: AuthSessionResult) {
  switch (result.type) {
    case 'cancel':
    case 'dismiss':
      return 'Google sign-in was cancelled.';
    case 'error':
      return 'Google sign-in could not start. Check the OAuth client setup and try again.';
    case 'locked':
      return 'Another sign-in window is already open.';
    default:
      return 'Google sign-in did not finish. Try again.';
  }
}
