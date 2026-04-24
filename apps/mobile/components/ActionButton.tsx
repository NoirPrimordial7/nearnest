import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, type as typography } from '../theme/tokens';

type ActionButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  leadingLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function ActionButton({
  label,
  leadingLabel,
  loading = false,
  loadingLabel,
  variant = 'primary',
  disabled,
  style,
  ...pressableProps
}: ActionButtonProps) {
  const isDisabled = disabled || loading;
  const visibleLabel = loading ? loadingLabel ?? label : label;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.textInvert : colors.primary700}
            size="small"
          />
        ) : leadingLabel ? (
          <View style={styles.leadingBadge}>
            <Text style={styles.leadingText}>{leadingLabel}</Text>
          </View>
        ) : null}
        <Text style={[styles.label, labelStyles[variant]]}>{visibleLabel}</Text>
      </View>
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
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  leadingBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
  },
  leadingText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '600',
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
  disabled: {
    opacity: 0.58,
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
