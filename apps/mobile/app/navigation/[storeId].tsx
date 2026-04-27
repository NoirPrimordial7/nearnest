import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { RealMapView } from '../../components/RealMapView';
import { useFontScale } from '../../hooks/useFontScale';
import { getMedicineDetailApi, getStoreDetailApi } from '../../services/discoveryApi';
import { openExternalUrl } from '../../services/externalLinks';
import {
  requestCurrentLocation,
  watchUserLocation,
  type LocationWatcher,
  type UserLocation,
} from '../../services/location';
import { formatStoreAddress, getPhoneUrl } from '../../services/mockDiscovery';
import {
  formatRouteDistance,
  formatRouteDuration,
  getRoutePreviewApi,
  type RoutePreview,
} from '../../services/routePreview';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { Medicine, Store } from '../../types/discovery';

const PUNE_FALLBACK_LOCATION: UserLocation = {
  lat: 18.559,
  lng: 73.7868,
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function storeDestination(store: Store): UserLocation {
  const lat = Number(store.location?.lat);
  const lng = Number(store.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }

  if (__DEV__) {
    console.warn('[RoutePreview] using Pune fallback destination coordinates', {
      storeId: store.id,
    });
  }
  return PUNE_FALLBACK_LOCATION;
}

export default function InAppRoutePreviewScreen() {
  const params = useLocalSearchParams();
  const storeId = getParamValue(params.storeId);
  const medicineId = getParamValue(params.medicineId);
  const [store, setStore] = useState<Store | null>(null);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(true);
  const [startMode, setStartMode] = useState(false);
  const [watcher, setWatcher] = useState<LocationWatcher | null>(null);
  const [actionError, setActionError] = useState('');
  const [backendError, setBackendError] = useState('');
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBackendError('');
    const storeRequest = getStoreDetailApi(storeId);
    const medicineRequest = medicineId ? getMedicineDetailApi(medicineId) : Promise.resolve(null);

    void Promise.all([storeRequest, medicineRequest])
      .then(([storeResult, medicineResult]) => {
        if (cancelled) {
          return;
        }
        setStore(storeResult.store);
        setMedicine(medicineResult?.medicine ?? null);
        if (storeResult.source === 'mock' && storeResult.error) {
          setBackendError(storeResult.error);
        } else if (medicineResult?.source === 'mock' && medicineResult.error) {
          setBackendError(medicineResult.error);
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
  }, [medicineId, storeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocationAndRoute() {
      if (!store) {
        return;
      }

      setRouteLoading(true);
      const locationResult = await requestCurrentLocation();
      const origin =
        locationResult.status === 'granted' ? locationResult.location : PUNE_FALLBACK_LOCATION;

      if (locationResult.status !== 'granted') {
        setLocationMessage('Location unavailable. Showing an in-app Pune preview.');
      }

      if (cancelled) {
        return;
      }

      setUserLocation(origin);
      const destination = storeDestination(store);
      const preview = await getRoutePreviewApi(origin, destination);
      if (!cancelled) {
        setRoutePreview(preview);
        setRouteLoading(false);
      }
    }

    void loadLocationAndRoute();

    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    return () => {
      watcher?.remove();
    };
  }, [watcher]);

  const destination = useMemo(() => (store ? storeDestination(store) : null), [store]);
  const routeDistance = formatRouteDistance(routePreview?.distanceMeters);
  const routeDuration = formatRouteDuration(routePreview?.duration);

  async function callStore() {
    if (!store) {
      return;
    }
    setActionError('');
    medifindTelemetry.emit('medifind.stores.store_call_clicked', {
      store_id: store.id,
      from_screen: 'in_app_navigation',
      medicine_id: medicine?.id ?? null,
    });
    const opened = await openExternalUrl(getPhoneUrl(store));
    if (!opened) {
      setActionError('We could not open the dialer on this device.');
    }
  }

  async function startPreview() {
    if (startMode) {
      return;
    }
    setStartMode(true);
    const nextWatcher = await watchUserLocation(
      (location) => setUserLocation(location),
      (message) => setLocationMessage(message),
    );
    setWatcher(nextWatcher);
  }

  function endPreview() {
    watcher?.remove();
    setWatcher(null);
    setStartMode(false);
  }

  function viewStoreDetails() {
    if (!store) {
      return;
    }
    router.push({ pathname: '/store/[storeId]', params: { storeId: store.id } });
  }

  if (loading && !store) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text style={[styles.eyebrow, { fontSize: scale(typography.caption), lineHeight: scaleLineHeight(16) }]}>
            IN-APP ROUTE
          </Text>
          <Text style={[styles.title, { fontSize: scale(typography.h1), lineHeight: scaleLineHeight(32) }]}>
            Preparing route preview
          </Text>
          <Text style={[styles.body, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
            Loading public store details and your foreground location.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store || !destination) {
    return (
      <ErrorState
        body="This pharmacy is not available in Medifind yet."
        errorCode="store_not_found"
        screenId="in_app_navigation"
        title="Route unavailable"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.stayInside}>Navigation stays inside Medifind</Text>
        </View>

        <RealMapView
          routeCoordinates={routePreview?.coordinates}
          selectedStore={store}
          startMode={startMode}
          stores={[store]}
          title={startMode ? 'Navigation preview active' : 'In-app route preview'}
          userLocation={userLocation}
        />

        <View style={styles.panel}>
          <View style={styles.badgeRow}>
            {store.verified ? <Badge kind="verified" /> : <Badge kind="callToConfirm" label="Not verified" />}
            <Badge kind={store.isOpenNow ? 'fresh' : 'neutral'} label={store.isOpenNow ? store.closesAtLabel ?? 'Open now' : 'Closed now'} />
          </View>

          <Text style={[styles.title, { fontSize: scale(typography.h1), lineHeight: scaleLineHeight(32) }]}>
            {store.name}
          </Text>
          <Text style={[styles.body, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
            {formatStoreAddress(store)}
          </Text>

          <View style={styles.metricRow}>
            <Metric label="Distance" value={routeLoading ? 'Checking...' : routeDistance} />
            <Metric label="Travel time" value={routeLoading ? 'Checking...' : routeDuration} />
          </View>

          {medicine ? (
            <View style={styles.medicineContext}>
              <Text style={[styles.contextLabel, { fontSize: scale(typography.caption), lineHeight: scaleLineHeight(16) }]}>
                MEDICINE CONTEXT
              </Text>
              <Text style={[styles.contextTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
                {medicine.name}
              </Text>
              {medicine.requiresPrescription ? <Badge kind="rx" label="Prescription required" /> : null}
            </View>
          ) : null}

          {routePreview?.source === 'fallback' ? (
            <Text style={[styles.note, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Live route unavailable. Showing in-app preview.
            </Text>
          ) : null}
          {locationMessage ? (
            <Text style={[styles.note, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              {locationMessage}
            </Text>
          ) : null}
          {backendError ? (
            <Text style={[styles.note, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Using local demo route details while live pharmacy data is unavailable.
            </Text>
          ) : null}
          {actionError ? (
            <Text style={[styles.errorText, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              {actionError}
            </Text>
          ) : null}

          <View style={styles.safetyBox}>
            <Text style={[styles.safetyTitle, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              In-app route preview. Confirm local road conditions before travelling.
            </Text>
            <Text style={[styles.note, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              This is not turn-by-turn GPS. Call the pharmacy to confirm availability before you go.
            </Text>
          </View>

          <View style={styles.actionStack}>
            {startMode ? (
              <ActionButton label="End preview" onPress={endPreview} />
            ) : (
              <ActionButton label="Start in-app preview" onPress={() => void startPreview()} />
            )}
            <ActionButton label="Call store" onPress={() => void callStore()} variant="secondary" />
            <ActionButton label="View store details" onPress={viewStoreDetails} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  loadingWrap: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  backText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '800',
  },
  stayInside: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.bodySm,
    fontWeight: '700',
    textAlign: 'right',
  },
  panel: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary700,
    fontWeight: '800',
    letterSpacing: 0.48,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  medicineContext: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  contextLabel: {
    color: colors.primary700,
    fontWeight: '800',
    letterSpacing: 0.48,
  },
  contextTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  safetyBox: {
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.primary50,
    padding: spacing.lg,
  },
  safetyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  note: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
  },
  actionStack: {
    gap: spacing.md,
  },
});
