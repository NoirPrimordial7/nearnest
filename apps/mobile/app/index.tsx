import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandInitial}>M</Text>
      </View>
      <Text style={styles.wordmark}>Medifind</Text>
      <Text style={styles.tagline}>Find nearby medicines faster.</Text>
      <Text style={styles.status}>Placeholder splash. Backend bootstrapping is not wired yet.</Text>
      <ActionButton
        label="Continue"
        style={styles.action}
        onPress={() => router.replace('/welcome')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xxl,
  },
  brandMark: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    marginBottom: spacing.md,
  },
  brandInitial: {
    color: colors.primary600,
    fontSize: typography.display,
    fontWeight: '600',
  },
  wordmark: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '600',
    lineHeight: 32,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  status: {
    color: colors.textSoft,
    fontSize: typography.caption,
    lineHeight: 16,
    marginTop: spacing.xxxl,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
  },
});
