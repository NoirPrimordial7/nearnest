import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, type as typography } from '../theme/tokens';

type ActionButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function ActionButton({
  label,
  variant = 'primary',
  style,
  ...pressableProps
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.primary500,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ghost: {
    minHeight: 44,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.textInvert,
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.primary700,
  },
});

const variantStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
};

const labelStyles = {
  primary: styles.primaryLabel,
  secondary: styles.secondaryLabel,
  ghost: styles.ghostLabel,
};
