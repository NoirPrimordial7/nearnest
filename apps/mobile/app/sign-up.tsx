import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function SignUpScreen() {
  return (
    <Screen
      eyebrow="Create account"
      title="Create your Medifind account"
      description="Save your search area and find verified stores faster."
      footer={
        <>
          <ActionButton label="Create account" onPress={() => router.replace('/profile-setup')} />
          <ActionButton
            label="Continue with Google"
            variant="secondary"
            onPress={() => router.replace('/profile-setup')}
          />
          <ActionButton
            label="Already have an account? Sign in"
            variant="ghost"
            onPress={() => router.push('/sign-in')}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
          />
        </View>
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
            placeholder="Create a password"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            style={styles.input}
          />
          <Text style={styles.helper}>Use at least 8 characters.</Text>
        </View>
        <View style={styles.termsBox}>
          <View style={styles.checkbox} />
          <Text style={styles.terms}>I agree to the Medifind Terms and Privacy Policy.</Text>
        </View>
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
    color: colors.textSoft,
    fontSize: typography.bodySm,
  },
  termsBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  terms: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
