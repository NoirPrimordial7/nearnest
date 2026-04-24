import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, signInWithEmail } from '../services/auth';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type LoadingAction = 'email' | null;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  async function handleEmailSignIn() {
    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }

    if (!password) {
      setFormError('Enter your password.');
      return;
    }

    setFormError('');
    setLoadingAction('email');
    try {
      await signInWithEmail(email, password);
      router.replace('/home');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  const isBusy = loadingAction !== null;

  return (
    <Screen
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to keep your saved areas and recent medicine searches."
      footer={
        <>
          <ActionButton
            label="Sign in"
            loading={loadingAction === 'email'}
            loadingLabel="Signing in"
            onPress={handleEmailSignIn}
          />
          <ActionButton
            disabled
            label="Google sign-in coming soon"
            leadingLabel="G"
            variant="secondary"
          />
          <ActionButton
            disabled
            label="Phone login coming soon"
            leadingLabel="Ph"
            variant="secondary"
          />
          <ActionButton
            disabled={isBusy}
            label="New to Medifind? Create account"
            onPress={() => router.push('/sign-up')}
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            editable={!isBusy}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={email}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            editable={!isBusy}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>
        <Text style={styles.forgotLink}>Forgot password?</Text>
        {formError ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Action needed</Text>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>
              Email sign-in uses Firebase Auth from Expo environment config.
            </Text>
          </View>
        )}
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
  forgotLink: {
    alignSelf: 'flex-end',
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '500',
    minHeight: 18,
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
});
