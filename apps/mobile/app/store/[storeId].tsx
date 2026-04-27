import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { StaleDataBanner } from '../../components/StaleDataBanner';
import { useFontScale } from '../../hooks/useFontScale';
import { getStoreDetailApi } from '../../services/discoveryApi';
import { openExternalUrl } from '../../services/externalLinks';
import {
  formatComposition,
  formatDistance,
  formatFreshness,
  formatPrice,
  formatStoreAddress,
  getPhoneUrl,
  getStockLabel,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { ResultFilter, Store, StoreInventoryGroup } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function StoreDetailScreen() {
  const params = useLocalSearchParams();
  const storeId = getParamValue(params.storeId);
  const [store, setStore] = useState<Store | null>(null);
  const [groups, setGroups] = useState<StoreInventoryGroup[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [hoursOpen, setHoursOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [backendError, setBackendError] = useState('');
  const [loading, setLoading] = useState(true);
  const hasStale = groups.some((group) =>
    group.items.some(({ freshnessStatus }) => freshnessStatus !== 'fresh'),
  );
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBackendError('');
    void getStoreDetailApi(storeId, query, filter)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setStore(result.store);
        setGroups(result.groups);
        if (result.source === 'mock' && result.error) {
          setBackendError(result.error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filter, query, storeId]);

  if (loading && !store) {
    return (
      <Screen
        eyebrow="Store"
        title="Loading store"
        description="Checking public store details and current inventory."
      />
    );
  }

  if (!store) {
    return (
      <Screen
        eyebrow="Store"
        title="Store not found"
        description="This store is not available in Medifind yet."
        footer={<ActionButton label="Back to home" onPress={() => router.replace('/home')} />}
      />
    );
  }
  const currentStore = store;

  async function callStore() {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_call_clicked', {
      store_id: currentStore.id,
      from_screen: 'store_detail',
    });
    const opened = await openExternalUrl(getPhoneUrl(currentStore));
    if (!opened) {
      setActionError('We could not open the dialer on this device.');
    }
  }

  function openRoutePreview() {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_navigate_clicked', {
      store_id: currentStore.id,
      from_screen: 'store_detail',
    });
    router.push({ pathname: '/navigation/[storeId]', params: { storeId: currentStore.id } });
  }

  function submitInventorySearch() {
    medifindTelemetry.emit('medifind.store.in_store_search_used', {
      store_id: currentStore.id,
      q_length: query.trim().length,
    });
  }

  return (
    <Screen
      eyebrow="Store detail"
      title={store.name}
      description="Confirm the store, contact details, and inventory freshness before travelling."
      footer={
        <>
          <ActionButton label="In-app route" onPress={openRoutePreview} />
          <ActionButton label="Call store" onPress={() => void callStore()} variant="secondary" />
        </>
      }
    >
      <View style={styles.stack}>
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            {store.verified ? <Badge kind="verified" /> : <Badge kind="callToConfirm" label="Not verified" />}
            <Badge kind={store.isOpenNow ? 'fresh' : 'neutral'} label={store.isOpenNow ? store.closesAtLabel ?? 'Open now' : 'Closed now'} />
          </View>
          <Text style={[styles.heroName, { fontSize: scale(typography.h2), lineHeight: scaleLineHeight(28) }]}>
            {store.name}
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            {formatDistance(store.distanceKm)} away - {store.address.line2 ?? store.address.line1}
          </Text>
          <Pressable accessibilityHint="Tap to see issuing authority" accessibilityRole="button" onPress={() => setLicenseOpen((value) => !value)}>
            <Text style={[styles.license, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Drug license: {store.licenseNumber ?? 'Not listed'}
            </Text>
          </Pressable>
          {licenseOpen && store.licenseAuthority ? (
            <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Issued by {store.licenseAuthority}.
            </Text>
          ) : null}
        </View>

        {actionError ? (
          <ErrorState
            body={actionError}
            errorCode="external_link_failed"
            screenId="store_detail"
            title="Action could not open"
          />
        ) : null}
        {backendError ? (
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Using local demo inventory while live store data is unavailable.
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <ActionButton label="Call" onPress={() => void callStore()} style={styles.actionButton} variant="secondary" />
          <ActionButton label="Route" onPress={openRoutePreview} style={styles.actionButton} variant="secondary" />
          <ActionButton label="Hours" onPress={() => setHoursOpen((value) => !value)} style={styles.actionButton} variant="secondary" />
        </View>

        {hoursOpen ? <HoursPanel /> : null}

        <View style={styles.addressBlock}>
          <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            Address
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
            {formatStoreAddress(store)}
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Public phone: {store.contact.publicPhoneE164}
          </Text>
        </View>

        <SearchBar
          onChangeText={setQuery}
          onSubmitEditing={submitInventorySearch}
          placeholder="Search items in this store"
          value={query}
          variant="input"
        />
        <View style={styles.filterRow}>
          {(['all', 'otc', 'rx'] as ResultFilter[]).map((filterValue) => (
            <Chip
              key={filterValue}
              label={filterValue === 'all' ? 'All' : filterValue.toUpperCase()}
              onPress={() => setFilter(filterValue)}
              selected={filter === filterValue}
              variant={filterValue === 'rx' ? 'rx' : 'default'}
            />
          ))}
        </View>

        {hasStale ? <StaleDataBanner /> : null}

        {loading ? (
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Loading current inventory...
          </Text>
        ) : groups.length === 0 ? (
          <EmptyState
            actionLabel={query ? 'Clear search' : 'Call store'}
            body={
              query
                ? `No items match "${query}" at this pharmacy.`
                : 'This pharmacy has not posted recent stock. Call to ask in person.'
            }
            onAction={query ? () => setQuery('') : () => void callStore()}
            title={query ? 'No inventory match' : 'No listed inventory'}
          />
        ) : (
          <View style={styles.inventoryStack}>
            {groups.map((group) => (
              <View key={group.category.id} style={styles.inventoryGroup}>
                <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
                  {group.category.name}
                </Text>
                {group.items.map(({ medicine, item, freshnessStatus }) => (
                  <Pressable
                    accessibilityRole="button"
                    key={`${item.storeId}-${item.medicineId}`}
                    onPress={() =>
                      router.push({
                        pathname: '/medicine/[medicineId]',
                        params: { medicineId: medicine.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.inventoryRow,
                      freshnessStatus === 'very_stale' && styles.dimmed,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.inventoryTitleRow}>
                      <Text
                        numberOfLines={2}
                        style={[styles.inventoryName, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}
                      >
                        {medicine.name}
                      </Text>
                      {medicine.requiresPrescription ? <Badge kind="rx" /> : null}
                    </View>
                    <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
                      {formatComposition(medicine)}
                    </Text>
                    <Text
                      style={[
                        styles.freshness,
                        freshnessStatus === 'stale' && styles.stale,
                        freshnessStatus === 'very_stale' && styles.veryStale,
                        { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
                      ]}
                    >
                      {getStockLabel(item)} - {formatFreshness(item.updatedAt)} - {formatPrice(item)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          Stock can change. Call the store to confirm before you travel.
        </Text>
      </View>
    </Screen>
  );
}

function HoursPanel() {
  const rows = ['Sun 09:00-22:00', 'Mon-Fri 08:30-22:30', 'Sat 09:00-22:00'];
  return (
    <View style={styles.hoursPanel}>
      {rows.map((row) => (
        <Text key={row} style={styles.hoursRow}>
          {row}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroName: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
  license: {
    color: colors.primary700,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 112,
    flexGrow: 1,
  },
  hoursPanel: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  hoursRow: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  addressBlock: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inventoryStack: {
    gap: spacing.xl,
  },
  inventoryGroup: {
    gap: spacing.md,
  },
  inventoryRow: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  inventoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  inventoryName: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  freshness: {
    color: colors.success,
    fontWeight: '600',
  },
  stale: {
    color: colors.warning,
  },
  veryStale: {
    color: colors.textSoft,
  },
  dimmed: {
    opacity: 0.78,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  disclaimer: {
    color: colors.textMuted,
  },
});
