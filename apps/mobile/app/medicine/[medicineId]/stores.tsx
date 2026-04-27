import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { BottomSheet } from '../../../components/BottomSheet';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { RealMapView } from '../../../components/RealMapView';
import { StoreCard } from '../../../components/StoreCard';
import { useFontScale } from '../../../hooks/useFontScale';
import { getMedicineDetailApi, getNearbyStoresApi } from '../../../services/discoveryApi';
import { openExternalUrl } from '../../../services/externalLinks';
import {
  getPhoneUrl,
} from '../../../services/mockDiscovery';
import { medifindTelemetry } from '../../../services/telemetry';
import { colors, spacing, type as typography } from '../../../theme/tokens';
import type { Medicine, MedicineAvailability, Store } from '../../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function NearbyStoresForMedicineScreen() {
  const params = useLocalSearchParams();
  const medicineId = getParamValue(params.medicineId);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [availability, setAvailability] = useState<MedicineAvailability[]>([]);
  const [mapStores, setMapStores] = useState<Store[]>([]);
  const [sheetMode, setSheetMode] = useState<'list' | 'map'>('list');
  const [actionError, setActionError] = useState('');
  const [backendError, setBackendError] = useState('');
  const [loading, setLoading] = useState(true);
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBackendError('');
    void Promise.all([getMedicineDetailApi(medicineId), getNearbyStoresApi(medicineId)])
      .then(([detail, nearby]) => {
        if (cancelled) {
          return;
        }
        setMedicine(detail.medicine);
        setAvailability(detail.availability);
        setMapStores(
          detail.availability.length > 0
            ? detail.availability.map((row) => row.store)
            : nearby.stores,
        );
        if ((detail.source === 'mock' && detail.error) || (nearby.source === 'mock' && nearby.error)) {
          setBackendError(detail.error ?? nearby.error ?? 'Discovery backend unavailable.');
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
  }, [medicineId]);

  useEffect(() => {
    medifindTelemetry.emit('medifind.stores.list_view_open', {
      medicine_id: medicine?.id ?? null,
    });
  }, [medicine?.id]);

  if (!loading && !medicine) {
    return (
      <ErrorState
        body="This medicine is not available in Medifind yet."
        errorCode="medicine_not_found"
        screenId="medicine_stores"
        title="Medicine not found"
      />
    );
  }

  function toggleSheetMode(nextMode: 'list' | 'map') {
    setSheetMode(nextMode);
    if (nextMode === 'map') {
      medifindTelemetry.emit('medifind.stores.map_view_open', { medicine_id: medicineId });
    } else {
      medifindTelemetry.emit('medifind.stores.list_view_open', { medicine_id: medicineId });
    }
  }

  async function openPhone(store: Store) {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_call_clicked', {
      store_id: store.id,
      from_screen: 'medicine_stores',
    });
    const opened = await openExternalUrl(getPhoneUrl(store));
    if (!opened) {
      setActionError('We could not open the dialer on this device.');
    }
  }

  function openRoute(store: Store) {
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_navigate_clicked', {
      store_id: store.id,
      from_screen: 'medicine_stores',
    });
    router.push({
      pathname: '/navigation/[storeId]',
      params: { storeId: store.id, medicineId },
    });
  }

  function openStore(row: MedicineAvailability) {
    medifindTelemetry.emit('medifind.stores.store_card_tapped', {
      store_id: row.store.id,
    });
    router.push({ pathname: '/store/[storeId]', params: { storeId: row.store.id } });
  }

  return (
    <View style={styles.container}>
      <RealMapView stores={mapStores} title={medicine?.name ?? 'Nearby pharmacies'} />
      <BottomSheet>
        <View style={styles.sheetHeader}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.sheetLink}>Back</Text>
          </Pressable>
          <View style={styles.titleBlock}>
            <Text
              numberOfLines={1}
              style={[styles.title, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}
            >
              {loading ? 'Loading nearby stores' : medicine?.name}
            </Text>
            {medicine?.requiresPrescription ? <Badge kind="rx" label="Prescription required" /> : null}
          </View>
        </View>

        <View style={styles.toggleRow}>
          <ToggleButton label="List" selected={sheetMode === 'list'} onPress={() => toggleSheetMode('list')} />
          <ToggleButton label="Map" selected={sheetMode === 'map'} onPress={() => toggleSheetMode('map')} />
        </View>

        {actionError ? (
          <ErrorState
            body={actionError}
            errorCode="external_link_failed"
            screenId="medicine_stores"
            title="Action could not open"
          />
        ) : null}
        {backendError ? (
          <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Using local demo availability while live pharmacy data is unavailable.
          </Text>
        ) : null}

        {loading ? (
          <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Checking current pharmacy inventory...
          </Text>
        ) : availability.length === 0 ? (
          <EmptyState
            actionLabel="Browse pharmacies"
            body="Try a wider radius or browse pharmacies and ask in person."
            onAction={() => router.push('/stores')}
            title="No nearby pharmacies have this right now."
          />
        ) : (
          <View style={styles.storeStack}>
            {availability.map((row) => (
              <StoreCard
                inventoryItem={row.item}
                key={`${row.store.id}-${row.item.medicineId}`}
                onCall={() => {
                  void openPhone(row.store);
                }}
                onNavigate={() => {
                  openRoute(row.store);
                }}
                onPress={() => openStore(row)}
                store={row.store}
              />
            ))}
          </View>
        )}

        <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          Stock can change. Call the store to confirm before you travel.
        </Text>
      </BottomSheet>
    </View>
  );
}

function ToggleButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.toggleButton, selected && styles.toggleButtonSelected]}
    >
      <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    backgroundColor: colors.bg,
    padding: spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  sheetLink: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  toggleButtonSelected: {
    backgroundColor: colors.primary50,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  toggleTextSelected: {
    color: colors.primary700,
  },
  storeStack: {
    gap: spacing.md,
  },
  disclaimer: {
    color: colors.textMuted,
  },
});
