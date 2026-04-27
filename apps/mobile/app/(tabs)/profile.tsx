import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Screen } from '../../components/Screen';
import { useFontScale } from '../../hooks/useFontScale';
import { signOut, subscribeToAuthState } from '../../services/auth';
import { getRecentSearches } from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { loadUserProfile, type UserProfile } from '../../services/userProfile';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savingScale, setSavingScale] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { largeType, scale, scaleLineHeight, setLargeType } = useFontScale();
  const recentSearches = getRecentSearches().slice(0, 5);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user || cancelled) {
        return;
      }

      const loaded = await loadUserProfile(user.uid);
      if (!cancelled) {
        setProfile(loaded);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function toggleLargeType(nextValue: boolean) {
    setSavingScale(true);
    try {
      await setLargeType(nextValue);
      medifindTelemetry.emit('medifind.profile.large_type_toggled', {
        enabled: nextValue,
      });
    } finally {
      setSavingScale(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/welcome');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen
      eyebrow="Profile"
      title={profile?.displayName ?? profile?.email ?? 'Medifind profile'}
      description="Manage display preferences, recent searches, and account actions."
      footer={
        <ActionButton
          disabled={signingOut}
          label="Sign out"
          loading={signingOut}
          loadingLabel="Signing out"
          onPress={handleSignOut}
          variant="secondary"
        />
      }
    >
      <View style={styles.stack}>
        <View style={styles.profileCard}>
          {profile?.photoURL || profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoURL ?? profile.photoUrl ?? '' }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {(profile?.displayName ?? profile?.email ?? 'M').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={[styles.cardTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
              {profile?.displayName ?? profile?.name ?? 'Medifind user'}
            </Text>
            <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              {profile?.email ?? 'Signed-in account'}
            </Text>
          </View>
        </View>

        <View style={styles.preferenceCard}>
          <View style={styles.preferenceText}>
            <Text style={[styles.cardTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
              Larger text
            </Text>
            <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Increases Medifind text size by 15 percent for easier scanning.
            </Text>
          </View>
          <Switch
            disabled={savingScale}
            onValueChange={(nextValue) => {
              void toggleLargeType(nextValue);
            }}
            trackColor={{ false: colors.border, true: colors.primary300 }}
            thumbColor={largeType ? colors.primary700 : colors.surface}
            value={largeType}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.cardTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            Account
          </Text>
          <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            {profile?.email ?? 'Signed-in account'}
          </Text>
          <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Preferred search radius: {profile?.preferences?.preferredSearchRadiusKm ?? 5} km
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.cardTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            App and support
          </Text>
          {['Help and support', 'Privacy policy', 'Terms of use', 'About Medifind'].map((label) => (
            <Pressable
              accessibilityRole="button"
              key={label}
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
            >
              <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.cardTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            Recent searches
          </Text>
          {recentSearches.map((recent) => (
            <Pressable
              accessibilityRole="button"
              key={`${recent.query}-${recent.ts}`}
              onPress={() => router.push({ pathname: '/results', params: { q: recent.query } })}
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
            >
              <Text style={[styles.cardBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
                {recent.query}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surfaceAlt,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.primary50,
  },
  avatarText: {
    color: colors.primary700,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  preferenceText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.textMuted,
  },
  recentRow: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.84,
  },
});

