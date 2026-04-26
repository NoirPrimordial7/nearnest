import { Pressable, StyleSheet, Text } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Category } from '../types/discovery';

type CategoryCardProps = {
  category: Category;
  onPress: () => void;
};

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={[styles.icon, { fontSize: scale(typography.bodySm) }]}>
        {category.iconKey.toUpperCase().slice(0, 2)}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.label, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '23%',
    minWidth: 76,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    padding: spacing.md,
  },
  icon: {
    overflow: 'hidden',
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    color: colors.primary700,
    fontWeight: '700',
    lineHeight: 42,
    textAlign: 'center',
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
