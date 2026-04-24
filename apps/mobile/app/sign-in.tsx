import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function SignInScreen() {
  return (
    <Screen
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to keep your saved areas and recent medicine searches."
      footer={
        <>
          <ActionButton label="Sign in" onPress={() => router.replace('/profile-setup')} />
          <ActionButton
            label="Continue with Google"
            variant="secondary"
            onPress={() => router.replace('/profile-setup')}
          />
          <ActionButton
            label="New to Medifind? Create account"
            variant="ghost"
            onPress={() => router.push('/sign-up')}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <Text style={styles.helper}>Forgot password?</Text>
        <Text style={styles.note}>Firebase Auth actions are placeholders until backend config is added.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  helper: {
    alignSelf: 'flex-end',
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  note: {
    color: colors.textSoft,
    fontSize: typography.caption,
    lineHeight: 16,
  },
});
