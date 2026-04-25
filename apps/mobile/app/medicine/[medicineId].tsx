import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Screen } from '../../components/Screen';
import {
  formatDistance,
  getMapsUrl,
  getMedicineStoreAvailability,
  getMockMedicineById,
  getPhoneUrl,
  getStatusLabel,
} from '../../services/mockDiscovery';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { AvailabilityStatus, StoreAvailabilityResult } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function MedicineDetailScreen() {
  const params = useLocalSearchParams();
  const medicineId = getParamValue(params.medicineId);
  const medicine = getMockMedicineById(medicineId);
  const stores = medicine ? getMedicineStoreAvailability(medicine.id) : [];

  if (!medicine) {
    return (
      <Screen
        eyebrow="Medicine"
        title="Medicine not found"
        description="This mock medicine is not available in the local discovery data."
        footer={<ActionButton label="Back to search" onPress={() => router.replace('/search')} />}
      />
    );
  }

  return (
    <Screen
      eyebrow="Medicine detail"
      title={medicine.name}
      description="Medifind only shows nearby store availability. It does not provide medical advice."
      footer={
        <ActionButton
          label="Back to search"
          onPress={() => router.push({ pathname: '/search', params: { q: medicine.name } })}
          variant="secondary"
        />
      }
    >
      <View style={styles.summaryCard}>
        <View style={styles.titleRow}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          {medicine.requiresPrescription ? <Text style={styles.rxBadge}>Rx</Text> : null}
        </View>
        <Text style={styles.meta}>
          {medicine.salt} • {medicine.strength} • {medicine.form}
        </Text>
        <Text style={styles.meta}>{medicine.packSize}</Text>
        <Text style={styles.meta}>{medicine.manufacturer}</Text>
      </View>

      {medicine.requiresPrescription ? (
        <View style={styles.rxPanel}>
          <Text style={styles.rxTitle}>Prescription required</Text>
          <Text style={styles.rxBody}>
            Please carry a valid prescription when you visit or call the store.
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby stores that have it</Text>
        <Text style={styles.sectionHint}>Mock availability</Text>
      </View>

      {stores.length > 0 ? (
        <View style={styles.storeStack}>
          {stores.map((result) => (
            <StoreAvailabilityCard key={result.availability.id} result={result} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No nearby stores found</Text>
          <Text style={styles.emptyBody}>
            Real availability will come from the search backend after the discovery
            contracts are ready.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function StoreAvailabilityCard({ result }: { result: StoreAvailabilityResult }) {
  const { store, availability } = result;

  return (
    <View style={styles.storeCard}>
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
        <Text style={styles.meta}>
          {formatDistance(store.distanceKm)} • {store.locality} •{' '}
          {store.isOpen ? `Open until ${store.closesAt}` : 'Closed now'}
        </Text>
        <Text style={styles.meta}>
          {availability.priceLabel} • {availability.updatedLabel}
        </Text>
      </Pressable>
      <View style={styles.actionRow}>
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
    <Text style={[styles.availabilityBadge, badgeStyles[status]]}>
      {getStatusLabel(status)}
    </Text>
  );
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
  summaryCard: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
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
  meta: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
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
  rxPanel: {
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  rxTitle: {
    color: colors.rxText,
    fontSize: typography.body,
    fontWeight: '700',
  },
  rxBody: {
    color: colors.rxText,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  storeStack: {
    gap: spacing.md,
  },
  storeCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
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
  availabilityBadge: {
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
  actionRow: {
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
    backgroundColor: colors.bg,
  },
  smallActionText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '700',
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
