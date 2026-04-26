import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type ChipProps = PressableProps & {
  label: string;
  selected?: boolean;
  variant?: 'default' | 'rx';
};

export function Chip({ label, selected = false, variant = 'default', style, ...props }: ChipProps) {
  const { largeType, scale, scaleLineHeight } = useFontScale();

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        largeType && styles.largeType,
        variant === 'rx' && styles.rx,
        selected && styles.selected,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          variant === 'rx' && styles.rxLabel,
          selected && styles.selectedLabel,
          { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  largeType: {
    minHeight: 44,
  },
  selected: {
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
  },
  rx: {
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: colors.text,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.primary700,
  },
  rxLabel: {
    color: colors.rxText,
  },
});
