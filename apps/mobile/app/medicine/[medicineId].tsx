import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { Screen } from '../../components/Screen';
import { StaleDataBanner } from '../../components/StaleDataBanner';
import { useFontScale } from '../../hooks/useFontScale';
import { getMedicineDetailApi } from '../../services/discoveryApi';
import {
  formatComposition,
  formatDistance,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { Medicine, MedicineAvailability } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function MedicineDetailScreen() {
  const params = useLocalSearchParams();
  const medicineId = getParamValue(params.medicineId);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [stores, setStores] = useState<MedicineAvailability[]>([]);
  const [similar, setSimilar] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState('');
  const hasStale = stores.some(({ freshnessStatus }) => freshnessStatus !== 'fresh');
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBackendError('');
    void getMedicineDetailApi(medicineId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setMedicine(result.medicine);
        setStores(result.availability);
        setSimilar(result.similar);
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
  }, [medicineId]);

  useEffect(() => {
    if (medicine) {
      medifindTelemetry.emit('medifind.results.medicine_viewed', {
        medicine_id: medicine.id,
        result_group: 'detail',
      });
    }
  }, [medicine]);

  if (loading) {
    return (
      <Screen
        eyebrow="Medicine"
        title="Loading medicine"
        description="Checking current pharmacy availability."
      />
    );
  }

  if (!medicine) {
    return (
      <Screen
        eyebrow="Medicine"
        title="Medicine not found"
        description="This medicine is not available in Medifind yet."
        footer={<ActionButton label="Back to search" onPress={() => router.replace('/search')} />}
      />
    );
  }

  function openStores() {
    medifindTelemetry.emit('medifind.results.find_stores_tapped', {
      medicine_id: medicineId,
      available_count: stores.length,
    });
    router.push({
      pathname: '/medicine/[medicineId]/stores',
      params: { medicineId },
    });
  }

  return (
    <Screen
      eyebrow="Medicine detail"
      title={medicine.name}
      description="Review non-medical facts and then choose a nearby pharmacy."
      footer={<ActionButton label={stores.length > 0 ? 'Find nearby stores' : 'Show pharmacies anyway'} onPress={openStores} />}
    >
      <View style={styles.stack}>
        <View style={styles.hero}>
          <Text style={[styles.heroLetter, { fontSize: scale(64), lineHeight: scaleLineHeight(70) }]}>
            {medicine.name.slice(0, 1)}
          </Text>
        </View>

        <View style={styles.identity}>
          <View style={styles.badgeRow}>
            {medicine.requiresPrescription ? <Badge kind="rx" label="Prescription required" /> : null}
            <Badge kind="availableNearby" label={`Available at ${stores.length} nearby`} />
          </View>
          <Text style={[styles.name, { fontSize: scale(typography.h2), lineHeight: scaleLineHeight(28) }]}>
            {medicine.name}
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
            {formatComposition(medicine)}
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            {medicine.packSize} - {medicine.form}
          </Text>
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            By {medicine.manufacturer.name}
          </Text>
          {medicine.description ? (
            <Text style={[styles.description, { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) }]}>
              {medicine.description}
            </Text>
          ) : null}
        </View>

        {medicine.requiresPrescription ? (
          <View style={styles.rxBlock}>
            <Text style={[styles.rxTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
              Prescription required
            </Text>
            <Text style={[styles.rxBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Please carry a valid prescription when you visit or call the store.
            </Text>
            <Text style={[styles.rxBody, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Medifind does not take prescriptions or fulfil orders.
            </Text>
          </View>
        ) : null}

        {hasStale ? <StaleDataBanner /> : null}
        {backendError ? (
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            Using local demo availability while live pharmacy data is unavailable.
          </Text>
        ) : null}

        <View style={styles.availabilityCard}>
          <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            {stores.length > 0
              ? `Available at ${stores.length} nearby pharmacies`
              : 'Not currently in nearby pharmacies.'}
          </Text>
          {stores.length > 0 ? (
            <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              {stores
                .slice(0, 3)
                .map(({ store }) => `${store.name} (${formatDistance(store.distanceKm)})`)
                .join(', ')}
              {stores.length > 3 ? ` +${stores.length - 3} more` : ''}
            </Text>
          ) : (
            <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
              Browse pharmacies and call directly to ask in person.
            </Text>
          )}
        </View>

        {similar.length > 0 ? (
          <View style={styles.similarSection}>
            <Text style={[styles.sectionTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
              Similar medicines
            </Text>
            <View style={styles.similarStack}>
              {similar.map((similarMedicine) => (
                <ProductCard
                  key={similarMedicine.id}
                  medicine={similarMedicine}
                  onPress={() => {
                    medifindTelemetry.emit('medifind.results.similar_tapped', {
                      medicine_id: medicine.id,
                      similar_id: similarMedicine.id,
                    });
                    router.push({
                      pathname: '/medicine/[medicineId]',
                      params: { medicineId: similarMedicine.id },
                    });
                  }}
                />
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            body="No similar medicines are present in the mock catalog."
            title="No similar medicines yet"
          />
        )}

        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/results', params: { q: medicine.name } })}>
          <Text style={styles.backToResults}>Back to grouped results</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  hero: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
  },
  heroLetter: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  identity: {
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
  description: {
    color: colors.text,
  },
  rxBlock: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    padding: spacing.xl,
  },
  rxTitle: {
    color: colors.rxText,
    fontWeight: '700',
  },
  rxBody: {
    color: colors.rxText,
  },
  availabilityCard: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  similarSection: {
    gap: spacing.md,
  },
  similarStack: {
    gap: spacing.md,
  },
  backToResults: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
    textAlign: 'center',
  },
});
