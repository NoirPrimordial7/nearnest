import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, signInWithEmail, signInWithGoogleIdToken } from '../services/auth';
import {
  getGoogleAuthRequestConfig,
  getGoogleAuthResultMessage,
  getGoogleAuthUnavailableMessage,
} from '../services/googleAuth';
import { getPostAuthRouteForUser } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type LoadingAction = 'email' | 'google' | null;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const result = await signInWithGoogleIdToken(idToken);
        router.replace(await getPostAuthRouteForUser(result.user));
      } catch (error) {
        setFormError(getAuthErrorMessage(error));
      } finally {
        setLoadingAction(null);
      }
    }

    void completeGoogleSignIn();
  }, [googleResponse, loadingAction]);

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
      const result = await signInWithEmail(email, password);
      router.replace(await getPostAuthRouteForUser(result.user));
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
      setFormError('Google sign-in is still loading. Try again in a moment.');
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
            disabled={isBusy}
            label="Continue with Google"
            leadingLabel="G"
            loading={loadingAction === 'google'}
            loadingLabel="Opening Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
          />
          <ActionButton
            disabled
            label="Phone login coming soon"
            leadingLabel="Ph"
            onPress={() => router.push('/phone-otp')}
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
        <Pressable
          accessibilityRole="link"
          disabled={isBusy}
          onPress={() => router.push('/forgot-password')}
          style={styles.forgotLinkPressable}
        >
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </Pressable>
        {formError ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Action needed</Text>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>
              Email uses Firebase Auth now. Google creates your Medifind profile after sign-in.
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
  forgotLinkPressable: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  forgotLink: {
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
