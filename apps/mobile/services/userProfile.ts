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

const MOBILE_USERS_COLLECTION = 'mobileUsers';

function mobileUserRef(uid: string) {
  return doc(db, MOBILE_USERS_COLLECTION, uid);
}

function legacyUserRef(uid: string) {
  return doc(db, 'users', uid);
}

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

function getLegacyPhone(profile: DocumentData | null) {
  const directPhone = typeof profile?.phone === 'string' ? profile.phone.trim() : '';
  const nestedPhone =
    profile?.profile && typeof profile.profile.phone === 'string'
      ? profile.profile.phone.trim()
      : '';

  return directPhone || nestedPhone || null;
}

export async function upsertUserProfileFromAuthUser(
  user: User,
  fallbackProvider: AuthProviderId,
  options: { displayName?: string } = {},
) {
  const userRef = mobileUserRef(user.uid);
  const existingProfile = await getDoc(userRef);
  const legacyProfile = existingProfile.exists()
    ? null
    : await getDoc(legacyUserRef(user.uid))
        .then((snapshot) => (snapshot.exists() ? snapshot.data() : null))
        .catch(() => null);
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
  const legacyPreferences =
    legacyProfile?.preferences && typeof legacyProfile.preferences === 'object'
      ? legacyProfile.preferences
      : defaultPreferences;
  const legacyProfileComplete = Boolean(
    legacyProfile?.profileComplete ?? legacyProfile?.hasProfile ?? false,
  );
  const initialProfileData: Record<string, unknown> = {
    ...sharedProfileData,
    preferences: legacyPreferences,
    profileComplete: legacyProfileComplete,
    hasProfile: legacyProfileComplete,
    createdAt: legacyProfile?.createdAt ?? now,
  };
  const legacyPhone = getLegacyPhone(legacyProfile);

  if (legacyPhone) {
    initialProfileData.phone = legacyPhone;
  }

  await setDoc(
    userRef,
    existingProfile.exists() ? sharedProfileData : initialProfileData,
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
  const userRef = mobileUserRef(uid);
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
  const userRef = mobileUserRef(uid);
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
  const userRef = mobileUserRef(user.uid);
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
