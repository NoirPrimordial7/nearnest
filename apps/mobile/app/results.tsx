import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { Screen } from '../components/Screen';
import { StaleDataBanner } from '../components/StaleDataBanner';
import { useFontScale } from '../hooks/useFontScale';
import {
  getAvailabilityCount,
  getResultGroups,
  hasStaleDataForMedicine,
} from '../services/mockDiscovery';
import { medifindTelemetry } from '../services/telemetry';
import { colors, spacing, type as typography } from '../theme/tokens';
import type { Medicine, ResultFilter } from '../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const query = getParamValue(params.q);
  const [filter, setFilter] = useState<ResultFilter>('all');
  const groups = useMemo(() => getResultGroups(query, filter), [filter, query]);
  const visibleMedicines = [
    groups.bestMatch,
    ...groups.brandVariants,
    ...groups.sameComposition,
    ...groups.similarByCategory,
  ].filter(Boolean) as Medicine[];
  const hasStale = visibleMedicines.some((medicine) => hasStaleDataForMedicine(medicine.id));

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
      available_count: getAvailabilityCount(medicine.id),
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

        {groups.framingCopy ? <NeutralFraming text={groups.framingCopy} /> : null}
        {hasStale ? <StaleDataBanner /> : null}

        {visibleMedicines.length === 0 ? (
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
                medicine={groups.bestMatch}
                onFindStores={() => openStores(groups.bestMatch as Medicine)}
                onPress={() => openMedicine(groups.bestMatch as Medicine, 'best_match')}
                variant="large"
              />
            ) : null}

            <ResultGroup
              medicines={groups.brandVariants}
              onFindStores={openStores}
              onOpenMedicine={(medicine) => openMedicine(medicine, 'brand_variant')}
              title={groups.bestMatch ? `Other ${groups.bestMatch.manufacturer.name} options` : 'Brand options'}
            />
            <ResultGroup
              medicines={groups.sameComposition}
              onFindStores={openStores}
              onOpenMedicine={(medicine) => openMedicine(medicine, 'same_composition')}
              title="Same composition"
            />
            <ResultGroup
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
  onOpenMedicine,
  onFindStores,
}: {
  title: string;
  medicines: Medicine[];
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
