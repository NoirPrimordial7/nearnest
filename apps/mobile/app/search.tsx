import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import {
  formatDistance,
  getMapsUrl,
  getPhoneUrl,
  getStatusLabel,
  searchMockMedicines,
} from '../services/mockDiscovery';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type {
  AvailabilityStatus,
  MedicineSearchResult,
  StoreAvailabilityResult,
} from '../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const initialQuery = getParamValue(params.q);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  useEffect(() => {
    const nextQuery = getParamValue(params.q);
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  }, [params.q]);

  const results = useMemo(
    () => searchMockMedicines(submittedQuery),
    [submittedQuery],
  );

  function submitSearch() {
    setSubmittedQuery(query.trim());
  }

  const hasQuery = submittedQuery.trim().length > 0;

  return (
    <Screen
      eyebrow="Search"
      title="Find medicine availability"
      description="Mock results show the discovery shape only. Real stock will come from the backend search service."
      footer={
        <ActionButton
          label="Back to home"
          onPress={() => router.replace('/home')}
          variant="secondary"
        />
      }
    >
      <View style={styles.searchPanel}>
        <TextInput
          autoCapitalize="words"
          onChangeText={setQuery}
          onSubmitEditing={submitSearch}
          placeholder="Search by brand, salt, or strength"
          placeholderTextColor={colors.textSoft}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        <ActionButton label="Search" onPress={submitSearch} />
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>
          {hasQuery ? `Results for "${submittedQuery}"` : 'Popular availability nearby'}
        </Text>
        <Text style={styles.resultHint}>
          Availability is indicative. Call the store before travelling.
        </Text>
      </View>

      {results.length > 0 ? (
        <View style={styles.resultStack}>
          {results.map((result) => (
            <MedicineResultCard key={result.medicine.id} result={result} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No mock results found</Text>
          <Text style={styles.emptyBody}>
            Try Dolo, Cetirizine, ORS, Azithral, or Atorva while backend search is
            still mocked.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function MedicineResultCard({ result }: { result: MedicineSearchResult }) {
  const { medicine, stores } = result;

  return (
    <View style={styles.medicineCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/medicine/[medicineId]',
            params: { medicineId: medicine.id },
          })
        }
        style={({ pressed }) => [styles.medicineHeader, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          {medicine.requiresPrescription ? <RxBadge /> : null}
        </View>
        <Text style={styles.medicineMeta}>
          {medicine.salt} • {medicine.strength} • {medicine.form}
        </Text>
        <Text style={styles.viewDetails}>View medicine details</Text>
      </Pressable>

      <View style={styles.availabilityStack}>
        {stores.map((storeResult) => (
          <AvailabilityRow
            key={storeResult.availability.id}
            requiresPrescription={medicine.requiresPrescription}
            result={storeResult}
          />
        ))}
      </View>
    </View>
  );
}

function AvailabilityRow({
  result,
  requiresPrescription,
}: {
  result: StoreAvailabilityResult;
  requiresPrescription: boolean;
}) {
  const { store, availability } = result;

  return (
    <View style={styles.availabilityRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/store/[storeId]',
            params: { storeId: store.id },
          })
        }
        style={({ pressed }) => [styles.storeInfo, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.storeName}>{store.name}</Text>
          <AvailabilityBadge status={availability.status} />
        </View>
        <Text style={styles.storeMeta}>
          {formatDistance(store.distanceKm)} • {store.locality} •{' '}
          {store.isOpen ? `Open until ${store.closesAt}` : 'Closed now'}
        </Text>
        <Text style={styles.storeMeta}>
          {availability.priceLabel} • {availability.updatedLabel}
        </Text>
        {requiresPrescription ? (
          <Text style={styles.rxWarning}>
            Prescription required. Please carry a valid prescription when you visit
            or call the store.
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.rowActions}>
        <SmallAction
          label="Call"
          onPress={() => {
            void Linking.openURL(getPhoneUrl(store));
          }}
        />
        <SmallAction
          label="Navigate"
          onPress={() => {
            void Linking.openURL(getMapsUrl(store));
          }}
        />
      </View>
    </View>
  );
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <Text style={[styles.badge, badgeStyles[status]]}>{getStatusLabel(status)}</Text>
  );
}

function RxBadge() {
  return <Text style={styles.rxBadge}>Prescription required</Text>;
}

function SmallAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
    >
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchPanel: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  searchInput: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  resultHeader: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
  },
  resultHint: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  resultStack: {
    gap: spacing.lg,
  },
  medicineCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  medicineHeader: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicineName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '700',
    lineHeight: 28,
  },
  medicineMeta: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  viewDetails: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  availabilityStack: {
    gap: spacing.md,
  },
  availabilityRow: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  storeInfo: {
    gap: spacing.sm,
  },
  storeName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  storeMeta: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  rxWarning: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    color: colors.rxText,
    fontSize: typography.bodySm,
    lineHeight: 18,
    padding: spacing.md,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallAction: {
    minHeight: 40,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  smallActionText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  availableBadge: {
    backgroundColor: colors.primary50,
    color: colors.primary700,
  },
  lowStockBadge: {
    backgroundColor: colors.rxBg,
    color: colors.warning,
  },
  callBadge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
  },
  rxBadge: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    color: colors.rxText,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptyCard: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});

const badgeStyles = {
  available: styles.availableBadge,
  low_stock: styles.lowStockBadge,
  call_to_confirm: styles.callBadge,
};
