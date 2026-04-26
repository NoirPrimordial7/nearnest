import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import {
  formatComposition,
  getAvailabilityCount,
} from '../services/mockDiscovery';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Medicine } from '../types/discovery';
import { ActionButton } from './ActionButton';
import { Badge } from './Badge';

type ProductCardProps = {
  medicine: Medicine;
  variant?: 'large' | 'compact' | 'grid';
  onPress: () => void;
  onFindStores?: () => void;
};

export function ProductCard({
  medicine,
  variant = 'compact',
  onPress,
  onFindStores,
}: ProductCardProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const availabilityCount = getAvailabilityCount(medicine.id);
  const isGrid = variant === 'grid';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        variant === 'large' && styles.large,
        isGrid && styles.grid,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.image, variant === 'large' && styles.imageLarge, isGrid && styles.imageGrid]}>
        <Text style={[styles.imageLetter, { fontSize: scale(typography.h2) }]}>
          {medicine.name.slice(0, 1)}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          {medicine.requiresPrescription ? <Badge kind="rx" /> : null}
          {availabilityCount > 0 ? (
            <Badge kind="availableNearby" label={`Available at ${availabilityCount} nearby`} />
          ) : (
            <Badge kind="callToConfirm" label="Not in nearby stores" />
          )}
        </View>
        <Text
          numberOfLines={2}
          style={[styles.name, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}
        >
          {medicine.name}
        </Text>
        <Text style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          {medicine.manufacturer.name}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.meta, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}
        >
          {formatComposition(medicine)} - {medicine.packSize}
        </Text>
        {onFindStores ? (
          <ActionButton label="Find nearby stores" onPress={onFindStores} variant="secondary" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  large: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  grid: {
    width: '48%',
    minHeight: 230,
    flexDirection: 'column',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  imageLarge: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  imageGrid: {
    width: '100%',
    aspectRatio: 1,
    height: undefined,
  },
  imageLetter: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
});
