import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { CategoryCard } from '../../components/CategoryCard';
import { Chip } from '../../components/Chip';
import { ErrorState } from '../../components/ErrorState';
import { ModeToggle } from '../../components/ModeToggle';
import { ProductCard } from '../../components/ProductCard';
import { RealMapView } from '../../components/RealMapView';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { StoreCard } from '../../components/StoreCard';
import { useFontScale } from '../../hooks/useFontScale';
import { getNearbyStoresApi } from '../../services/discoveryApi';
import { openExternalUrl } from '../../services/externalLinks';
import {
  getCategories,
  getMedicineById,
  getPhoneUrl,
  getPopularSuggestions,
  getRecentSearches,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { subscribeToAuthState } from '../../services/auth';
import { loadUserProfile, type UserProfile } from '../../services/userProfile';
import { colors, spacing, type as typography } from '../../theme/tokens';
import type { DiscoveryMode, Store, StoreInventoryItem } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const initialMode = getParamValue(params.mode) === 'stores' ? 'stores' : 'medicine';
  const [mode, setMode] = useState<DiscoveryMode>(initialMode);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [actionError, setActionError] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [availableItemsByStore, setAvailableItemsByStore] = useState<
    Record<string, StoreInventoryItem | undefined>
  >({});
  const [storesLoading, setStoresLoading] = useState(true);
  const [backendError, setBackendError] = useState('');
  const { scale, scaleLineHeight } = useFontScale();
  const categories = useMemo(getCategories, []);
  const recentSearches = useMemo(() => getRecentSearches().slice(0, 6), []);
  const popularMedicines = useMemo(
    () =>
      getPopularSuggestions()
        .filter((suggestion) => suggestion.routeHint.kind === 'medicine')
        .map((suggestion) =>
          suggestion.routeHint.kind === 'medicine'
            ? getMedicineById(suggestion.routeHint.medicineId)
            : null,
        )
        .filter(Boolean)
        .slice(0, 4),
    [],
  );

  useEffect(() => {
    medifindTelemetry.emit('medifind.app.launch', {
      auth_state: 'unknown',
      cached_profile: Boolean(profile),
      cold: true,
    });
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    setStoresLoading(true);
    setBackendError('');
    void getNearbyStoresApi()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setStores(result.stores.slice(0, 4));
        setAvailableItemsByStore(result.availableItemsByStore);
        if (result.source === 'mock' && result.error) {
          setBackendError(result.error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStoresLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user || cancelled) {
        return;
      }

      try {
        const loaded = await loadUserProfile(user.uid);
        if (!cancelled) {
          setProfile(loaded);
        }
      } catch {
        // Home can render without the profile while auth state settles.
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function updateMode(nextMode: DiscoveryMode) {
    setMode(nextMode);
    medifindTelemetry.emit('medifind.home.mode_toggle', { mode: nextMode });
  }

  async function openPhone(store: Store, fromScreen = 'home') {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_call_clicked', {
      store_id: store.id,
      from_screen: fromScreen,
    });
    const opened = await openExternalUrl(getPhoneUrl(store));
    if (!opened) {
      setActionError('We could not open the dialer on this device.');
    }
  }

  function openRoute(store: Store, fromScreen = 'home') {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_navigate_clicked', {
      store_id: store.id,
      from_screen: fromScreen,
    });
    router.push({ pathname: '/navigation/[storeId]', params: { storeId: store.id } });
  }

  return (
    <Screen
      eyebrow="Medifind discovery"
      title={profile?.displayName ? `Welcome, ${profile.displayName}` : 'Find medicine nearby'}
      description="Search a medicine, compare verified pharmacies, then call or preview the route before you go."
      footer={
        <ActionButton
          label={mode === 'medicine' ? 'Search medicines' : 'Browse nearby pharmacies'}
          onPress={() => router.push(mode === 'medicine' ? '/search' : '/stores')}
        />
      }
    >
      <View style={styles.stack}>
        <ModeToggle value={mode} onChange={updateMode} />

        {actionError ? (
          <ErrorState
            body={actionError}
            errorCode="external_link_failed"
            screenId="home"
            title="Action could not open"
          />
        ) : null}

        {mode === 'medicine' ? (
          <>
            <SearchBar
              onPress={() => router.push('/search')}
              placeholder="Search medicine, brand, or composition"
              variant="pressable"
            />

            <SectionHeader title="Recent searches" />
            <View style={styles.chipRow}>
              {recentSearches.map((recent) => (
                <Chip
                  key={`${recent.query}-${recent.ts}`}
                  label={recent.query}
                  onPress={() =>
                    router.push({ pathname: '/results', params: { q: recent.query } })
                  }
                />
              ))}
            </View>

            <SectionHeader title="Browse categories" />
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <CategoryCard
                  category={category}
                  key={category.id}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[categoryId]',
                      params: { categoryId: category.id },
                    })
                  }
                />
              ))}
            </View>

            <SectionHeader title="Popular nearby" actionLabel="See all" onAction={() => router.push('/search')} />
            <View style={styles.productStack}>
              {popularMedicines.map((medicine) =>
                medicine ? (
                  <ProductCard
                    key={medicine.id}
                    medicine={medicine}
                    onFindStores={() =>
                      router.push({
                        pathname: '/medicine/[medicineId]/stores',
                        params: { medicineId: medicine.id },
                      })
                    }
                    onPress={() =>
                      router.push({
                        pathname: '/medicine/[medicineId]',
                        params: { medicineId: medicine.id },
                      })
                    }
                    variant="compact"
                  />
                ) : null,
              )}
            </View>
          </>
        ) : (
          <>
            <RealMapView
              height={320}
              stores={stores}
              subtitle={`${stores.length} nearby ${stores.length === 1 ? 'store' : 'stores'}`}
              title="Stores around your search area"
            />
            <View style={styles.storeModeHeader}>
              <View>
                <Text
                  style={[
                    styles.storeModeTitle,
                    { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) },
                  ]}
                >
                  Medical stores near you
                </Text>
                <Text
                  style={[
                    styles.storeModeBody,
                    { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
                  ]}
                >
                  Browse pharmacies, view public contact details, or switch back to medicine search.
                </Text>
                {backendError ? (
                  <Text
                    style={[
                      styles.storeModeBody,
                      { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
                    ]}
                  >
                    Using local demo pharmacy data while live nearby stores are unavailable.
                  </Text>
                ) : null}
                {storesLoading ? (
                  <Text
                    style={[
                      styles.storeModeBody,
                      { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
                    ]}
                  >
                    Loading nearby pharmacies...
                  </Text>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" onPress={() => updateMode('medicine')}>
                <Text style={styles.modeLink}>Search a medicine</Text>
              </Pressable>
            </View>
            <View style={styles.productStack}>
              {stores.map((store) => (
                <StoreCard
                  inventoryItem={availableItemsByStore[store.id]}
                  key={store.id}
                  onCall={() => {
                    void openPhone(store, 'home_stores_mode');
                  }}
                  onNavigate={() => {
                    openRoute(store, 'home_stores_mode');
                  }}
                  onPress={() => {
                    medifindTelemetry.emit('medifind.stores.store_card_tapped', {
                      store_id: store.id,
                    });
                    router.push({ pathname: '/store/[storeId]', params: { storeId: store.id } });
                  }}
                  store={store}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  sectionAction: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  productStack: {
    gap: spacing.lg,
  },
  storeModeHeader: {
    gap: spacing.md,
  },
  storeModeTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  storeModeBody: {
    color: colors.textMuted,
  },
  modeLink: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
});

