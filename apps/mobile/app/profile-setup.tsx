import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { auth } from '../services/firebase';
import { signOut, subscribeToAuthState } from '../services/auth';
import { loadUserProfile, markProfileComplete } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

const RADIUS_OPTIONS = [2, 5, 10] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];

export default function ProfileSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(5);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const unsubscribe = subscribeToAuthState(async (user) => {
        if (cancelled) {
          return;
        }
        if (!user) {
          router.replace('/sign-in');
          return;
        }

        const hasGoogleProvider = user.providerData.some(
          (provider) => provider.providerId === 'google.com',
        );
        if (user.email && !user.emailVerified && !hasGoogleProvider) {
          router.replace('/verify-email');
          return;
        }

        setDisplayName(user.displayName ?? user.email?.split('@')[0] ?? '');

        try {
          const profile = await loadUserProfile(user.uid);
          if (cancelled) {
            return;
          }
          if (profile?.displayName) {
            setDisplayName(profile.displayName);
          }
          const stored = profile?.preferences?.preferredSearchRadiusKm;
          if (stored && RADIUS_OPTIONS.includes(stored as RadiusKm)) {
            setRadiusKm(stored as RadiusKm);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      });

      return unsubscribe;
    }

    const unsubscribePromise = bootstrap();

    return () => {
      cancelled = true;
      void unsubscribePromise.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  async function handleContinue() {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('Enter a display name we can show on your profile.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);
    try {
      await markProfileComplete(user.uid, {
        displayName,
        preferredSearchRadiusKm: radiusKm,
      });
      router.replace('/home');
    } catch (error) {
      setErrorMessage('We could not save your profile. Try again.');
      if (__DEV__) {
        console.warn('markProfileComplete failed:', error);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace('/welcome');
    } catch {
      setErrorMessage('We could not sign you out. Try again.');
    }
  }

  return (
    <Screen
      eyebrow="Profile setup"
      title="Set your search preferences"
      description="Add the basics Medifind will use for saved areas and discovery."
      footer={
        <>
          <ActionButton
            label="Continue"
            loading={isSaving}
            loadingLabel="Saving"
            onPress={handleContinue}
          />
          <ActionButton
            disabled={isSaving}
            label="Sign out"
            variant="ghost"
            onPress={handleSignOut}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            editable={!isLoading && !isSaving}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={displayName}
          />
        </View>

        <InfoCard
          title="Preferred search radius"
          body="Medifind will use this when ranking nearby stores. You can change it any time."
        />
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Preferred search radius in kilometres"
          style={styles.radiusRow}
        >
          {RADIUS_OPTIONS.map((value) => {
            const isActive = value === radiusKm;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={`${value} kilometres`}
                accessibilityState={{ selected: isActive }}
                disabled={isLoading || isSaving}
                key={value}
                onPress={() => setRadiusKm(value)}
                style={[styles.radiusChip, isActive && styles.radiusChipActive]}
              >
                <Text style={[styles.radiusChipText, isActive && styles.radiusChipTextActive]}>
                  {value} km
                </Text>
              </Pressable>
            );
          })}
        </View>

        {errorMessage ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Action needed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radiusChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  radiusChipActive: {
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
  },
  radiusChipText: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  radiusChipTextActive: {
    color: colors.primary700,
  },
  errorPanel: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
