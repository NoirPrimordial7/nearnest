import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { Screen } from '../../components/Screen';
import {
  formatDistance,
  getMapsUrl,
  getMockStoreById,
  getPhoneUrl,
  getStatusLabel,
  getStoreInventory,
} from '../../services/mockDiscovery';
import { colors, radius, spacing, type as typography } from '../../theme/tokens';
import type { AvailabilityStatus } from '../../types/discovery';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function StoreDetailScreen() {
  const params = useLocalSearchParams();
  const storeId = getParamValue(params.storeId);
  const store = getMockStoreById(storeId);
  const inventory = store ? getStoreInventory(store.id) : [];
  const hasRxInventory = inventory.some(({ medicine }) => medicine.requiresPrescription);

  if (!store) {
    return (
      <Screen
        eyebrow="Store"
        title="Store not found"
        description="This mock store is not available in the local discovery data."
        footer={<ActionButton label="Back to search" onPress={() => router.replace('/search')} />}
      />
    );
  }

  return (
    <Screen
      eyebrow="Store detail"
      title={store.name}
      description="Review address, public contact, and mock availability before visiting."
      footer={
        <>
          <ActionButton
            label="Navigate to store"
            onPress={() => {
              void Linking.openURL(getMapsUrl(store));
            }}
          />
          <ActionButton
            label="Call store"
            onPress={() => {
              void Linking.openURL(getPhoneUrl(store));
            }}
            variant="secondary"
          />
        </>
      }
    >
      <View style={styles.storeSummary}>
        <View style={styles.badgeRow}>
          <Text style={styles.verifiedBadge}>Verified store</Text>
          <Text style={[styles.openBadge, !store.isOpen && styles.closedBadge]}>
            {store.isOpen ? `Open until ${store.closesAt}` : 'Closed now'}
          </Text>
        </View>
        <Text style={styles.address}>{store.address}</Text>
        <Text style={styles.meta}>
          {formatDistance(store.distanceKm)} away • {store.locality}
        </Text>
        <Text style={styles.meta}>{store.phone}</Text>
        <Text style={styles.freshness}>{store.freshnessLabel}</Text>
      </View>

      {hasRxInventory ? (
        <View style={styles.rxPanel}>
          <Text style={styles.rxTitle}>Prescription required for some medicines</Text>
          <Text style={styles.rxBody}>
            Please carry a valid prescription when you visit or call the store.
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available medicines</Text>
        <Text style={styles.sectionHint}>Mock inventory</Text>
      </View>

      <View style={styles.inventoryStack}>
        {inventory.map(({ medicine, availability }) => (
          <Pressable
            accessibilityRole="button"
            key={availability.id}
            onPress={() =>
              router.push({
                pathname: '/medicine/[medicineId]',
                params: { medicineId: medicine.id },
              })
            }
            style={({ pressed }) => [styles.inventoryRow, pressed && styles.pressed]}
          >
            <View style={styles.inventoryTitleRow}>
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <AvailabilityBadge status={availability.status} />
            </View>
            <Text style={styles.meta}>
              {medicine.salt} • {medicine.strength} • {medicine.form}
            </Text>
            <Text style={styles.meta}>
              {availability.priceLabel} • {availability.updatedLabel}
            </Text>
            {medicine.requiresPrescription ? (
              <Text style={styles.rxInline}>Prescription required</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <Text style={[styles.availabilityBadge, badgeStyles[status]]}>
      {getStatusLabel(status)}
    </Text>
  );
}

const styles = StyleSheet.create({
  storeSummary: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  verifiedBadge: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    color: colors.primary700,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  openBadge: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closedBadge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
  },
  address: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  freshness: {
    color: colors.textSoft,
    fontSize: typography.caption,
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
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  inventoryStack: {
    gap: spacing.md,
  },
  inventoryRow: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  inventoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicineName: {
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
  rxInline: {
    alignSelf: 'flex-start',
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
  pressed: {
    opacity: 0.72,
  },
});

const badgeStyles = {
  available: styles.availableBadge,
  low_stock: styles.lowStockBadge,
  call_to_confirm: styles.callBadge,
};
