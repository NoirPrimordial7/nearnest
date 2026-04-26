import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import {
  formatDistance,
  formatFreshness,
  formatPrice,
  formatStoreAddress,
  getFreshnessStatus,
  getStockLabel,
} from '../services/mockDiscovery';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Store, StoreInventoryItem } from '../types/discovery';
import { Badge } from './Badge';

type StoreCardProps = {
  store: Store;
  inventoryItem?: StoreInventoryItem;
  onPress: () => void;
  onCall: () => void;
  onNavigate: () => void;
  onViewStore?: () => void;
};

export function StoreCard({
  store,
  inventoryItem,
  onPress,
  onCall,
  onNavigate,
  onViewStore,
}: StoreCardProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const freshnessStatus = inventoryItem
    ? getFreshnessStatus(inventoryItem.updatedAt)
    : getFreshnessStatus(store.freshnessUpdatedAt);
  const freshnessKind =
    freshnessStatus === 'fresh' ? 'fresh' : freshnessStatus === 'stale' ? 'stale' : 'veryStale';

  return (
    <View style={[styles.card, freshnessStatus === 'very_stale' && styles.oldCard]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text
            style={[styles.name, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}
            numberOfLines={2}
          >
            {store.name}
          </Text>
          {store.verified ? <Badge kind="verified" /> : null}
        </View>
        <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          {formatDistance(store.distanceKm)} - {store.address.line2 ?? store.address.line1} -{' '}
          {store.isOpenNow ? store.closesAtLabel ?? 'Open now' : 'Closed now'}
        </Text>
        {inventoryItem ? (
          <Text
            style={[
              styles.freshness,
              freshnessStyles[freshnessStatus],
              { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
            ]}
          >
            {getStockLabel(inventoryItem)} - {formatFreshness(inventoryItem.updatedAt)} -{' '}
            {formatPrice(inventoryItem)}
          </Text>
        ) : (
          <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
            {formatStoreAddress(store)}
          </Text>
        )}
        <Badge kind={freshnessKind} label={inventoryItem ? 'Call to confirm availability' : store.freshnessLabel} />
      </Pressable>
      <View style={styles.actions}>
        <CardAction label="Call" onPress={onCall} />
        <CardAction label="Navigate" onPress={onNavigate} />
        <CardAction label="View store" onPress={onViewStore ?? onPress} />
      </View>
    </View>
  );
}

function CardAction({ label, onPress }: { label: string; onPress: () => void }) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text style={[styles.actionLabel, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  oldCard: {
    opacity: 0.82,
  },
  body: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
  freshness: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xs,
  },
  actionLabel: {
    color: colors.primary700,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  freshText: {
    color: colors.success,
  },
  staleText: {
    color: colors.warning,
  },
  veryStaleText: {
    color: colors.textSoft,
  },
});

const freshnessStyles = {
  fresh: styles.freshText,
  stale: styles.staleText,
  very_stale: styles.veryStaleText,
};
