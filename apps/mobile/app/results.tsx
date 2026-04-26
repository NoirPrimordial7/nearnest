import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { StaleDataBanner } from '../components/StaleDataBanner';
import { useFontScale } from '../hooks/useFontScale';
import { searchMedicinesApi } from '../services/discoveryApi';
import { medifindTelemetry } from '../services/telemetry';
import { colors, spacing, type as typography } from '../theme/tokens';
import type { Medicine, MedicineAvailability, ResultFilter, ResultGroups } from '../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const query = getParamValue(params.q);
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [groups, setGroups] = useState<ResultGroups>({
    query,
    bestMatch: null,
    brandVariants: [],
    sameComposition: [],
    similarByCategory: [],
  });
  const [availabilityByMedicine, setAvailabilityByMedicine] = useState<
    Record<string, MedicineAvailability[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState('');
  const visibleMedicines = [
    groups.bestMatch,
    ...groups.brandVariants,
    ...groups.sameComposition,
    ...groups.similarByCategory,
  ].filter(Boolean) as Medicine[];
  const hasStale = visibleMedicines.some((medicine) =>
    (availabilityByMedicine[medicine.id] ?? []).some(
      ({ freshnessStatus }) => freshnessStatus !== 'fresh',
    ),
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBackendError('');
    void searchMedicinesApi({ q: query, filter })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setGroups(result.groups);
        setAvailabilityByMedicine(result.availabilityByMedicine);
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
  }, [filter, query]);

  function openMedicine(medicine: Medicine, resultGroup: string) {
    medifindTelemetry.emit('medifind.results.medicine_viewed', {
      medicine_id: medicine.id,
      result_group: resultGroup,
    });
    router.push({ pathname: '/medicine/[medicineId]', params: { medicineId: medicine.id } });
  }

  function openStores(medicine: Medicine) {
    medifindTelemetry.emit('medifind.results.find_stores_tapped', {
      medicine_id: medicine.id,
      available_count: availabilityByMedicine[medicine.id]?.length ?? 0,
    });
    router.push({
      pathname: '/medicine/[medicineId]/stores',
      params: { medicineId: medicine.id },
    });
  }

  return (
    <Screen
      eyebrow="Results"
      title={query ? `"${query}"` : 'Search results'}
      description="Choose the right medicine, then find nearby pharmacies that have it."
    >
      <View style={styles.stack}>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/search', params: { q: query } })}>
            <Text style={styles.headerLink}>Edit search</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.headerLink}>Back</Text>
          </Pressable>
        </View>

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

        {backendError ? (
          <NeutralFraming text="Using local demo data while live pharmacy availability is unavailable." />
        ) : null}
        {loading ? <NeutralFraming text="Loading current pharmacy availability..." /> : null}
        {groups.framingCopy ? <NeutralFraming text={groups.framingCopy} /> : null}
        {hasStale ? <StaleDataBanner /> : null}

        {!loading && visibleMedicines.length === 0 ? (
          <EmptyState
            actionLabel="Try another search"
            body="No exact match was found. Try a brand name or composition like Paracetamol."
            onAction={() => router.push('/search')}
            title={`No match for "${query}".`}
          />
        ) : (
          <>
            {groups.bestMatch ? (
              <ProductCard
                availabilityCount={availabilityByMedicine[groups.bestMatch.id]?.length ?? 0}
                medicine={groups.bestMatch}
                onFindStores={() => openStores(groups.bestMatch as Medicine)}
                onPress={() => openMedicine(groups.bestMatch as Medicine, 'best_match')}
                variant="large"
              />
            ) : null}

            <ResultGroup
              availabilityByMedicine={availabilityByMedicine}
              medicines={groups.brandVariants}
              onFindStores={openStores}
              onOpenMedicine={(medicine) => openMedicine(medicine, 'brand_variant')}
              title={groups.bestMatch ? `Other ${groups.bestMatch.manufacturer.name} options` : 'Brand options'}
            />
            <ResultGroup
              availabilityByMedicine={availabilityByMedicine}
              medicines={groups.sameComposition}
              onFindStores={openStores}
              onOpenMedicine={(medicine) => openMedicine(medicine, 'same_composition')}
              title="Same composition"
            />
            <ResultGroup
              availabilityByMedicine={availabilityByMedicine}
              medicines={groups.similarByCategory}
              onFindStores={openStores}
              onOpenMedicine={(medicine) => openMedicine(medicine, 'similar_category')}
              title="Similar by category"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

function NeutralFraming({ text }: { text: string }) {
  const { scale, scaleLineHeight } = useFontScale();
  return (
    <Text style={[styles.framing, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
      {text}
    </Text>
  );
}

function ResultGroup({
  title,
  medicines,
  availabilityByMedicine,
  onOpenMedicine,
  onFindStores,
}: {
  title: string;
  medicines: Medicine[];
  availabilityByMedicine: Record<string, MedicineAvailability[]>;
  onOpenMedicine: (medicine: Medicine) => void;
  onFindStores: (medicine: Medicine) => void;
}) {
  const { scale, scaleLineHeight } = useFontScale();

  if (medicines.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
        {title}
      </Text>
      <View style={styles.groupStack}>
        {medicines.map((medicine) => (
          <ProductCard
            availabilityCount={availabilityByMedicine[medicine.id]?.length ?? 0}
            key={medicine.id}
            medicine={medicine}
            onFindStores={() => onFindStores(medicine)}
            onPress={() => onOpenMedicine(medicine)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLink: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  framing: {
    color: colors.textMuted,
  },
  group: {
    gap: spacing.md,
  },
  groupTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  groupStack: {
    gap: spacing.md,
  },
});
