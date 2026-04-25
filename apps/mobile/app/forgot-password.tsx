import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, sendPasswordReset } from '../services/auth';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSendReset() {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Enter the email on your account.');
      return;
    }

    setErrorMessage('');
    setIsSending(true);
    try {
      await sendPasswordReset(trimmed);
      setSentTo(trimmed);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen
      eyebrow="Forgot password"
      title="Reset your password"
      description="We will email you a secure link to set a new password."
      footer={
        sentTo ? (
          <>
            <ActionButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            <ActionButton
              label="Send to a different email"
              variant="ghost"
              onPress={() => setSentTo(null)}
            />
          </>
        ) : (
          <>
            <ActionButton
              label="Send reset link"
              loading={isSending}
              loadingLabel="Sending"
              onPress={handleSendReset}
            />
            <ActionButton
              disabled={isSending}
              label="Back to sign in"
              variant="ghost"
              onPress={() => router.replace('/sign-in')}
            />
          </>
        )
      }
    >
      {sentTo ? (
        <View style={styles.successPanel}>
          <Text style={styles.successTitle}>Email sent</Text>
          <Text style={styles.successBody}>
            If an account exists for {sentTo}, a password reset email is on its way. Open the link
            in the email to choose a new password.
          </Text>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSending}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSoft}
              style={styles.input}
              value={email}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorPanel}>
              <Text style={styles.errorTitle}>Action needed</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : (
            <View style={styles.infoPanel}>
              <Text style={styles.infoText}>
                We send the reset link only to the address you used to sign up. The email may take
                a moment to arrive.
              </Text>
            </View>
          )}
        </View>
      )}
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
  successPanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  successTitle: {
    color: colors.primary700,
    fontSize: typography.h3,
    fontWeight: '600',
  },
  successBody: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  infoPanel: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },
  infoText: {
    color: colors.textSoft,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  errorPanel: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
