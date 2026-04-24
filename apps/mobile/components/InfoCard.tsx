import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { colors, radius, spacing, type as typography } from '../theme/tokens';

type InfoCardProps = ViewProps & {
  title: string;
  body: string;
};

export function InfoCard({ title, body, style, ...viewProps }: InfoCardProps) {
  return (
    <View style={[styles.card, style]} {...viewProps}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
