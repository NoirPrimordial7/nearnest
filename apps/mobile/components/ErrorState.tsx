import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { medifindTelemetry } from '../services/telemetry';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import { ActionButton } from './ActionButton';

type ErrorStateProps = {
  screenId: string;
  errorCode: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  screenId,
  errorCode,
  title,
  body,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  const { scale, scaleLineHeight } = useFontScale();

  useEffect(() => {
    medifindTelemetry.emit('medifind.error.shown', { screen_id: screenId, error_code: errorCode });
  }, [errorCode, screenId]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
        {title}
      </Text>
      <Text style={[styles.body, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  title: {
    color: colors.danger,
    fontWeight: '700',
  },
  body: {
    color: colors.textMuted,
  },
});
