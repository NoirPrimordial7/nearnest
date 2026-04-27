import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { useFontScale } from '../../hooks/useFontScale';
import { getMedicineDetailApi, getStoreDetailApi } from '../../services/discoveryApi';
import { openExternalUrl } from '../../services/externalLinks';
import { formatDistance, formatStoreAddress, getPhoneUrl } from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { Medicine, Store } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getTravelTimeLabel(distanceKm: number) {
  const minutes = Math.max(4, Math.round(distanceKm * 8 + 3));
  return `${minutes} min`;
}

export default function InAppRoutePreviewScreen() {
  const params = useLocalSearchParams();
  const storeId = getParamValue(params.storeId);
  const medicineId = getParamValue(params.medicineId);
  const [store, setStore] = useState<Store | null>(null);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
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

  const travelTime = useMemo(() => getTravelTimeLabel(store?.distanceKm ?? 0), [store?.distanceKm]);

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
            Loading public store details inside Medifind.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
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

        <View style={styles.mapHero}>
          <View style={styles.softZoneOne} />
          <View style={styles.softZoneTwo} />
          <View style={styles.roadOne} />
          <View style={styles.roadTwo} />
          <View style={styles.roadThree} />
          <View style={styles.routeOne} />
          <View style={styles.routeTwo} />
          <View style={styles.routeThree} />

          <View style={styles.startMarker}>
            <Text style={styles.startText}>You</Text>
          </View>
          <View style={styles.destinationMarker}>
            <View style={styles.destinationCore} />
          </View>
          <View style={styles.destinationLabel}>
            <Text numberOfLines={2} style={styles.destinationLabelText}>
              {store.name}
            </Text>
          </View>

          <View style={styles.mapCard}>
            <Text style={[styles.mapLabel, { fontSize: scale(typography.caption), lineHeight: scaleLineHeight(16) }]}>
              ROUTE PREVIEW
            </Text>
            <Text style={[styles.mapTitle, { fontSize: scale(typography.h2), lineHeight: scaleLineHeight(28) }]}>
              {store.name}
            </Text>
            <Text style={[styles.mapBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              {formatDistance(store.distanceKm)} away - about {travelTime}
            </Text>
          </View>
        </View>

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
            <Metric label="Distance" value={formatDistance(store.distanceKm)} />
            <Metric label="Estimated time" value={travelTime} />
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
              This is an in-app route preview.
            </Text>
            <Text style={[styles.note, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Confirm directions locally before travelling. Call the pharmacy to confirm availability.
            </Text>
          </View>

          <View style={styles.actionStack}>
            <ActionButton label="Call store" onPress={() => void callStore()} />
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
  mapHero: {
    minHeight: 360,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.primary50,
    padding: spacing.lg,
  },
  softZoneOne: {
    position: 'absolute',
    right: -50,
    top: -36,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.surface,
    opacity: 0.72,
  },
  softZoneTwo: {
    position: 'absolute',
    left: -54,
    bottom: -44,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: colors.primary100,
    opacity: 0.62,
  },
  roadOne: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: '46%',
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.82,
  },
  roadTwo: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    left: '52%',
    width: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.74,
  },
  roadThree: {
    position: 'absolute',
    left: '8%',
    top: '24%',
    width: '92%',
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.66,
    transform: [{ rotate: '-23deg' }],
  },
  routeOne: {
    position: 'absolute',
    left: '18%',
    top: '66%',
    width: '32%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '-22deg' }],
  },
  routeTwo: {
    position: 'absolute',
    left: '44%',
    top: '52%',
    width: '28%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '-46deg' }],
  },
  routeThree: {
    position: 'absolute',
    left: '64%',
    top: '34%',
    width: '20%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '10deg' }],
  },
  startMarker: {
    position: 'absolute',
    left: '12%',
    top: '68%',
    minWidth: 54,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.text,
  },
  startText: {
    color: colors.textInvert,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  destinationMarker: {
    position: 'absolute',
    right: '15%',
    top: '28%',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.primary500,
  },
  destinationCore: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  destinationLabel: {
    position: 'absolute',
    right: '8%',
    top: '39%',
    maxWidth: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  destinationLabelText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  mapCard: {
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  mapLabel: {
    color: colors.primary700,
    fontWeight: '800',
    letterSpacing: 0.48,
  },
  mapTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  mapBody: {
    color: colors.textMuted,
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
