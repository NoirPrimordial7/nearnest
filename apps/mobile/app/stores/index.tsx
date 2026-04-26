import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { SearchBar } from '../../components/SearchBar';
import { StoreCard } from '../../components/StoreCard';
import { useFontScale } from '../../hooks/useFontScale';
import { openExternalUrl } from '../../services/externalLinks';
import {
  getMapsUrl,
  getPhoneUrl,
  getStoresByDistance,
  normalize,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, spacing, type as typography } from '../../theme/tokens';
import type { Store } from '../../types/discovery';

export default function StoresLandingScreen() {
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const stores = useMemo(() => getStoresByDistance(), []);
  const visibleStores = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      return stores;
    }
    return stores.filter((store) =>
      [store.name, store.address.line1, store.address.line2, store.address.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [query, stores]);
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    medifindTelemetry.emit('medifind.stores.list_view_open', { medicine_id: null });
  }, []);

  async function openPhone(store: Store) {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_call_clicked', {
      store_id: store.id,
      from_screen: 'stores_landing',
    });
    const opened = await openExternalUrl(getPhoneUrl(store));
    if (!opened) {
      setActionError('We could not open the dialer on this device.');
    }
  }

  async function openMaps(store: Store) {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_navigate_clicked', {
      store_id: store.id,
      from_screen: 'stores_landing',
    });
    const opened = await openExternalUrl(getMapsUrl(store));
    if (!opened) {
      setActionError('We could not open maps on this device.');
    }
  }

  function openStore(store: Store) {
    medifindTelemetry.emit('medifind.stores.store_card_tapped', { store_id: store.id });
    router.push({ pathname: '/store/[storeId]', params: { storeId: store.id } });
  }

  return (
    <View style={styles.container}>
      <MapPlaceholder stores={visibleStores} />
      <BottomSheet>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: scale(typography.h2), lineHeight: scaleLineHeight(28) }]}>
            Pharmacies near you
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/home', params: { mode: 'medicine' } })}>
            <Text style={styles.switchLink}>Looking for a medicine?</Text>
          </Pressable>
        </View>

        <SearchBar
          onChangeText={setQuery}
          onSubmitEditing={() => medifindTelemetry.emit('medifind.search.submitted', { q_length: query.length, mode: 'stores', had_correction: false })}
          placeholder="Search a pharmacy by name or area"
          value={query}
          variant="input"
        />

        {actionError ? (
          <ErrorState
            body={actionError}
            errorCode="external_link_failed"
            screenId="stores_landing"
            title="Action could not open"
          />
        ) : null}

        {visibleStores.length === 0 ? (
          <EmptyState
            actionLabel="Clear search"
            body="Try a wider radius or check back later."
            onAction={() => setQuery('')}
            title="No verified pharmacies near you yet."
          />
        ) : (
          <View style={styles.storeStack}>
            {visibleStores.map((store) => (
              <StoreCard
                key={store.id}
                onCall={() => {
                  void openPhone(store);
                }}
                onNavigate={() => {
                  void openMaps(store);
                }}
                onPress={() => openStore(store)}
                store={store}
              />
            ))}
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    backgroundColor: colors.bg,
    padding: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  switchLink: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  storeStack: {
    gap: spacing.md,
  },
});
