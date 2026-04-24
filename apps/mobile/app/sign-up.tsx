import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, signUpWithEmail } from '../services/auth';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type LoadingAction = 'email' | null;

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  async function handleCreateAccount() {
    if (!fullName.trim()) {
      setFormError('Enter your full name.');
      return;
    }

    if (!email.trim()) {
      setFormError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setFormError('Use at least 8 characters.');
      return;
    }

    if (!acceptedTerms) {
      setFormError('Please accept the Terms and Privacy Policy.');
      return;
    }

    setFormError('');
    setLoadingAction('email');
    try {
      await signUpWithEmail(email, password);
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
      eyebrow="Create account"
      title="Create your Medifind account"
      description="Save your search area and find verified stores faster."
      footer={
        <>
          <ActionButton
            label="Create account"
            loading={loadingAction === 'email'}
            loadingLabel="Creating account"
            onPress={handleCreateAccount}
          />
          <ActionButton
            disabled
            label="Google sign-up coming soon"
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
            label="Already have an account? Sign in"
            onPress={() => router.push('/sign-in')}
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            editable={!isBusy}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={fullName}
          />
        </View>
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
            placeholder="Create a password"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <Text style={styles.helper}>Use at least 8 characters.</Text>
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          disabled={isBusy}
          onPress={() => setAcceptedTerms((current) => !current)}
          style={styles.termsBox}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]} />
          <Text style={styles.terms}>I agree to the Medifind Terms and Privacy Policy.</Text>
        </Pressable>
        {formError ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Action needed</Text>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>
              Email account access uses Firebase Auth from Expo environment config.
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
  checkboxActive: {
    borderColor: colors.primary600,
    backgroundColor: colors.primary500,
  },
  terms: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
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
