import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { medifindTelemetry } from '../services/telemetry';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type OfflineBannerProps = {
  screenId: string;
  text?: string;
};

export function OfflineBanner({ screenId, text = 'Live data is unavailable offline. Showing saved mock results.' }: OfflineBannerProps) {
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    medifindTelemetry.emit('medifind.offline.shown', { screen_id: screenId });
  }, [screenId]);

  return (
    <Text style={[styles.banner, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
    padding: spacing.lg,
  },
});
