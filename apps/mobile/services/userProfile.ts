import { GoogleAuthProvider, type User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';

import { db } from './firebase';

type AuthProviderId = 'password' | 'google.com';

const defaultPreferences = {
  preferredSearchRadiusKm: 5,
  openMapsApp: 'system',
  notifications: {
    availabilityAlerts: false,
    productUpdates: false,
  },
};

function getDisplayName(user: User) {
  return user.displayName?.trim() || user.email?.split('@')[0] || 'Medifind user';
}

function getDisplayNameWithOverride(user: User, displayNameOverride?: string) {
  return displayNameOverride?.trim() || getDisplayName(user);
}

function getAuthProviders(user: User) {
  return user.providerData
    .map((provider) => provider.providerId)
    .filter((providerId): providerId is string => Boolean(providerId));
}

function getPrimaryAuthProvider(user: User, fallback: AuthProviderId): AuthProviderId {
  const providers = getAuthProviders(user);

  if (providers.includes(GoogleAuthProvider.PROVIDER_ID)) {
    return GoogleAuthProvider.PROVIDER_ID;
  }

  return fallback;
}

function getAuthProvidersWithFallback(user: User, fallbackProvider: AuthProviderId) {
  const providers = getAuthProviders(user);
  return providers.includes(fallbackProvider) ? providers : [...providers, fallbackProvider];
}

function requiresEmailVerification(user: User) {
  const providers = getAuthProviders(user);
  const hasGoogleProvider = providers.includes(GoogleAuthProvider.PROVIDER_ID);

  return Boolean(user.email && !user.emailVerified && !hasGoogleProvider);
}

export async function upsertUserProfileFromAuthUser(
  user: User,
  fallbackProvider: AuthProviderId,
  options: { displayName?: string } = {},
) {
  const userRef = doc(db, 'users', user.uid);
  const existingProfile = await getDoc(userRef);
  const now = serverTimestamp();
  const displayName = getDisplayNameWithOverride(user, options.displayName);
  const authProvider = getPrimaryAuthProvider(user, fallbackProvider);
  const authProviders = getAuthProvidersWithFallback(user, fallbackProvider);
  const photoURL = user.photoURL ?? null;

  const sharedProfileData = {
    uid: user.uid,
    email: user.email ?? '',
    emailVerified: user.emailVerified,
    displayName,
    name: displayName,
    photoURL,
    photoUrl: photoURL,
    authProvider,
    authProviders,
    updatedAt: now,
    lastLoginAt: now,
  };

  await setDoc(
    userRef,
    existingProfile.exists()
      ? sharedProfileData
      : {
          ...sharedProfileData,
          preferences: defaultPreferences,
          profileComplete: false,
          hasProfile: false,
          createdAt: now,
        },
    { merge: true },
  );
}

export type UserProfile = DocumentData & {
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  name?: string;
  photoURL?: string | null;
  photoUrl?: string | null;
  authProvider?: AuthProviderId;
  authProviders?: string[];
  profileComplete?: boolean;
  hasProfile?: boolean;
  preferences?: {
    preferredSearchRadiusKm?: number;
    openMapsApp?: string;
    notifications?: {
      availabilityAlerts?: boolean;
      productUpdates?: boolean;
    };
  };
};

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function markProfileComplete(
  uid: string,
  fields: {
    displayName?: string;
    preferredSearchRadiusKm?: number;
  },
) {
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();
  const update: Record<string, unknown> = {
    profileComplete: true,
    hasProfile: true,
    updatedAt: now,
  };

  if (fields.displayName !== undefined) {
    const trimmed = fields.displayName.trim();
    if (trimmed) {
      update.displayName = trimmed;
      update.name = trimmed;
    }
  }

  if (fields.preferredSearchRadiusKm !== undefined) {
    update.preferences = {
      preferredSearchRadiusKm: fields.preferredSearchRadiusKm,
    };
  }

  await setDoc(userRef, update, { merge: true });
}

export async function refreshEmailVerifiedField(user: User) {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(
    userRef,
    {
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getPostAuthRouteForUser(user: User) {
  const fallbackProvider = user.providerData.some(
    (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID,
  )
    ? GoogleAuthProvider.PROVIDER_ID
    : 'password';

  await upsertUserProfileFromAuthUser(user, fallbackProvider);

  if (requiresEmailVerification(user)) {
    return '/verify-email' as const;
  }

  const profile = await loadUserProfile(user.uid);
  return profile?.profileComplete ? ('/home' as const) : ('/profile-setup' as const);
}
