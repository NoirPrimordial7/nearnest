import { StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import { ActionButton } from './ActionButton';

type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={[styles.icon, { fontSize: scale(typography.h2) }]}>M</Text>
      </View>
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
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.huge,
  },
  iconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
  },
  icon: {
    color: colors.primary700,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
