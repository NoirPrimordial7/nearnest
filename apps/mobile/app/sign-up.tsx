import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, signInWithGoogleIdToken, signUpWithEmail } from '../services/auth';
import {
  getGoogleAuthRequestConfig,
  getGoogleAuthResultMessage,
  getGoogleAuthUnavailableMessage,
} from '../services/googleAuth';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type LoadingAction = 'email' | 'google' | null;

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest(
    getGoogleAuthRequestConfig(),
  );
  const handledGoogleResponse = useRef<typeof googleResponse>(null);

  useEffect(() => {
    if (
      !googleResponse ||
      loadingAction !== 'google' ||
      handledGoogleResponse.current === googleResponse
    ) {
      return;
    }

    handledGoogleResponse.current = googleResponse;

    async function completeGoogleSignIn() {
      if (!googleResponse || googleResponse.type === 'opened') {
        return;
      }

      if (googleResponse.type !== 'success') {
        setFormError(getGoogleAuthResultMessage(googleResponse));
        setLoadingAction(null);
        return;
      }

      const idToken = googleResponse.params.id_token;

      if (!idToken) {
        setFormError('Google did not return an ID token. Check the Google client ID setup.');
        setLoadingAction(null);
        return;
      }

      try {
        await signInWithGoogleIdToken(idToken);
        router.replace('/home');
      } catch (error) {
        setFormError(getAuthErrorMessage(error));
      } finally {
        setLoadingAction(null);
      }
    }

    void completeGoogleSignIn();
  }, [googleResponse, loadingAction]);

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

  async function handleGoogleSignIn() {
    const unavailableMessage = getGoogleAuthUnavailableMessage();

    if (unavailableMessage) {
      setFormError(unavailableMessage);
      return;
    }

    if (!googleRequest) {
      setFormError('Google sign-up is still loading. Try again in a moment.');
      return;
    }

    setFormError('');
    setLoadingAction('google');

    try {
      await promptGoogleSignIn();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
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
            disabled={isBusy}
            label="Continue with Google"
            leadingLabel="G"
            loading={loadingAction === 'google'}
            loadingLabel="Opening Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
          />
          <ActionButton
            disabled={isBusy}
            label="Continue with phone"
            leadingLabel="Ph"
            onPress={() => router.push('/phone-otp')}
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
              Email uses Firebase Auth now. Google requires a Medifind development build and OAuth client IDs.
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
