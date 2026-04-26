import { StyleSheet, Text } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export type BadgeKind =
  | 'rx'
  | 'verified'
  | 'availableNearby'
  | 'callToConfirm'
  | 'fresh'
  | 'stale'
  | 'veryStale'
  | 'neutral';

type BadgeProps = {
  kind: BadgeKind;
  label?: string;
};

export function Badge({ kind, label }: BadgeProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const visibleLabel = label ?? defaultLabels[kind];

  return (
    <Text
      style={[
        styles.base,
        badgeStyles[kind],
        { fontSize: scale(typography.caption), lineHeight: scaleLineHeight(16) },
      ]}
    >
      {visibleLabel}
    </Text>
  );
}

const defaultLabels: Record<BadgeKind, string> = {
  rx: 'Rx',
  verified: 'Verified',
  availableNearby: 'Available nearby',
  callToConfirm: 'Call to confirm',
  fresh: 'Fresh',
  stale: 'Stale',
  veryStale: 'Call first',
  neutral: 'Info',
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  rx: {
    backgroundColor: colors.rxBg,
    borderColor: colors.rxBorder,
    color: colors.rxText,
  },
  verified: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary300,
    color: colors.primary700,
  },
  availableNearby: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
    color: colors.primary700,
  },
  callToConfirm: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  fresh: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
    color: colors.success,
  },
  stale: {
    backgroundColor: colors.rxBg,
    borderColor: colors.rxBorder,
    color: colors.warning,
  },
  veryStale: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    color: colors.textSoft,
  },
  neutral: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    color: colors.textMuted,
  },
});

const badgeStyles = {
  rx: styles.rx,
  verified: styles.verified,
  availableNearby: styles.availableNearby,
  callToConfirm: styles.callToConfirm,
  fresh: styles.fresh,
  stale: styles.stale,
  veryStale: styles.veryStale,
  neutral: styles.neutral,
};
