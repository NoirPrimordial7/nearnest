import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import {
  formatDistance,
  getMapsUrl,
  getNearbyStoresPreview,
  getPhoneUrl,
  getPopularMedicines,
  recentMedicineQueries,
} from '../services/mockDiscovery';
import { signOut, subscribeToAuthState } from '../services/auth';
import { loadUserProfile, type UserProfile } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { DiscoveryMedicine, DiscoveryStore } from '../types/discovery';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const nearbyStores = getNearbyStoresPreview();
  const popularMedicines = getPopularMedicines();

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (cancelled) {
        return;
      }
      if (!user) {
        return;
      }
      try {
        const loaded = await loadUserProfile(user.uid);
        if (!cancelled) {
          setProfile(loaded);
        }
      } catch {
        // Profile may not exist yet on a freshly-created account; safe to ignore here.
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function openSearch(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (trimmed) {
      router.push({ pathname: '/search', params: { q: trimmed } });
      return;
    }

    router.push('/search');
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
      eyebrow="Medifind discovery"
      title={profile?.displayName ? `Welcome, ${profile.displayName}` : 'Find a medicine nearby'}
      description="Search a medicine, compare nearby verified stores, then call or open directions before you go."
      footer={
        <>
          <ActionButton label="Search medicines" onPress={() => openSearch()} />
          <ActionButton
            disabled={signingOut}
            label="Sign out"
            loading={signingOut}
            loadingLabel="Signing out"
            onPress={handleSignOut}
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.searchPanel}>
        <Text style={styles.sectionTitle}>What do you need?</Text>
        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setQuery}
            onSubmitEditing={() => openSearch()}
            placeholder="Search medicine or salt"
            placeholderTextColor={colors.textSoft}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => openSearch()}
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
      </View>

      <SectionHeader
        title="Popular medicines"
        actionLabel="View all"
        onPress={() => router.push('/search')}
      />
      <View style={styles.chipWrap}>
        {popularMedicines.map((medicine) => (
          <MedicineChip key={medicine.id} medicine={medicine} onPress={openSearch} />
        ))}
        {recentMedicineQueries.map((recentQuery) => (
          <Pressable
            accessibilityRole="button"
            key={recentQuery}
            onPress={() => openSearch(recentQuery)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Text style={styles.chipText}>{recentQuery}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader
        title="Nearby verified stores"
        actionLabel="Search first"
        onPress={() => router.push('/search')}
      />
      <View style={styles.cardStack}>
        {nearbyStores.map((store) => (
          <StorePreviewCard key={store.id} store={store} />
        ))}
      </View>
    </Screen>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function MedicineChip({
  medicine,
  onPress,
}: {
  medicine: DiscoveryMedicine;
  onPress: (query: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(medicine.name)}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={styles.chipText}>{medicine.name}</Text>
      {medicine.requiresPrescription ? <Text style={styles.rxDot}>Rx</Text> : null}
    </Pressable>
  );
}

function StorePreviewCard({ store }: { store: DiscoveryStore }) {
  return (
    <View style={styles.storeCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/store/[storeId]', params: { storeId: store.id } })}
        style={({ pressed }) => [styles.storeMain, pressed && styles.pressed]}
      >
        <View style={styles.storeTitleRow}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.verifiedBadge}>Verified</Text>
        </View>
        <Text style={styles.storeMeta}>
          {formatDistance(store.distanceKm)} • {store.locality} •{' '}
          {store.isOpen ? `Open until ${store.closesAt}` : 'Closed now'}
        </Text>
        <Text style={styles.storeFreshness}>{store.freshnessLabel}</Text>
      </Pressable>
      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Linking.openURL(getPhoneUrl(store));
          }}
          style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
        >
          <Text style={styles.quickActionText}>Call</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Linking.openURL(getMapsUrl(store));
          }}
          style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
        >
          <Text style={styles.quickActionText}>Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchPanel: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '600',
    lineHeight: 24,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    minHeight: 48,
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  searchButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.lg,
  },
  searchButtonText: {
    color: colors.textInvert,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionAction: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  chipText: {
    color: colors.text,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  rxDot: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.rxBg,
    color: colors.rxText,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
  },
  cardStack: {
    gap: spacing.md,
  },
  storeCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  storeMain: {
    gap: spacing.sm,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
    lineHeight: 24,
  },
  verifiedBadge: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    color: colors.primary700,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  storeMeta: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  storeFreshness: {
    color: colors.textSoft,
    fontSize: typography.caption,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    minHeight: 40,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  quickActionText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
