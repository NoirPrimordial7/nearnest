import { StyleSheet, Text } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type StaleDataBannerProps = {
  severity?: 'stale' | 'very_stale';
};

export function StaleDataBanner({ severity = 'stale' }: StaleDataBannerProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const text =
    severity === 'very_stale'
      ? 'Some inventory was last updated more than 72 hours ago. Call before travelling.'
      : 'Some inventory was last updated more than 24 hours ago. Call to confirm availability.';

  return (
    <Text
      style={[
        styles.banner,
        severity === 'very_stale' && styles.veryStale,
        { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    color: colors.warning,
    padding: spacing.lg,
  },
  veryStale: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
  },
});
