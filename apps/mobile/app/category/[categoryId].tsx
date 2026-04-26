import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { Screen } from '../../components/Screen';
import { useFontScale } from '../../hooks/useFontScale';
import {
  getAvailabilityCount,
  getCategoryById,
  getMedicinesByCategory,
} from '../../services/mockDiscovery';
import { medifindTelemetry } from '../../services/telemetry';
import { colors, spacing, type as typography } from '../../theme/tokens';
import type { ResultFilter } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function CategoryBrowseScreen() {
  const params = useLocalSearchParams();
  const categoryId = getParamValue(params.categoryId);
  const category = getCategoryById(categoryId);
  const [filter, setFilter] = useState<ResultFilter>('all');
  const medicines = useMemo(
    () => (category ? getMedicinesByCategory(category.id, filter) : []),
    [category, filter],
  );
  const stockedCount = medicines.reduce(
    (count, medicine) => count + (getAvailabilityCount(medicine.id) > 0 ? 1 : 0),
    0,
  );
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    if (category) {
      medifindTelemetry.emit('medifind.category.opened', { category_id: category.id });
    }
  }, [category]);

  if (!category) {
    return (
      <Screen
        eyebrow="Category"
        title="Category not found"
        description="This category is not available in the local mock data."
      />
    );
  }

  return (
    <Screen
      eyebrow="Category"
      title={category.name}
      description={
        stockedCount > 0
          ? `${stockedCount} medicines stocked nearby`
          : 'No medicines from this category are stocked at nearby pharmacies right now.'
      }
    >
      <View style={styles.stack}>
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

        {medicines.length === 0 ? (
          <EmptyState
            actionLabel="Search instead"
            body={`Browse other categories or try a search for ${category.name}.`}
            onAction={() => router.push('/search')}
            title={`Nothing in ${category.name} nearby right now.`}
          />
        ) : (
          <View style={styles.grid}>
            {medicines.map((medicine) => (
              <ProductCard
                key={medicine.id}
                medicine={medicine}
                onPress={() => {
                  medifindTelemetry.emit('medifind.results.medicine_viewed', {
                    medicine_id: medicine.id,
                    result_group: 'category',
                  });
                  router.push({
                    pathname: '/medicine/[medicineId]',
                    params: { medicineId: medicine.id },
                  });
                }}
                variant="grid"
              />
            ))}
          </View>
        )}

        <Text style={[styles.disclaimer, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          Availability is indicative. Call the store to confirm before you travel.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  disclaimer: {
    color: colors.textMuted,
  },
});
