import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, spacing, type as typography } from '../theme/tokens';

type ScreenProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Screen({ eyebrow, title, description, children, footer }: ScreenProps) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {eyebrow ? (
            <Text
              style={[
                styles.eyebrow,
                { fontSize: scale(typography.caption), lineHeight: scaleLineHeight(16) },
              ]}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={[
              styles.title,
              { fontSize: scale(typography.h1), lineHeight: scaleLineHeight(32) },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.description,
                { fontSize: scale(typography.body), lineHeight: scaleLineHeight(22) },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  eyebrow: {
    color: colors.primary700,
    fontWeight: '600',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontWeight: '600',
  },
  description: {
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.md,
    padding: spacing.xxl,
    paddingTop: spacing.lg,
    backgroundColor: colors.bg,
  },
});
