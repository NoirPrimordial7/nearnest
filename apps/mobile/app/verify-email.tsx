import { router } from 'expo-router';
import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import {
  getAuthErrorMessage,
  reloadCurrentUser,
  sendVerificationEmailToCurrentUser,
  signOut,
  subscribeToAuthState,
} from '../services/auth';
import { getPostAuthRouteForUser } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

const RESEND_COOLDOWN_SECONDS = 30;
const POLL_INTERVAL_MS = 4000;

type LoadingAction = 'check' | 'resend' | 'sign-out' | null;

export default function VerifyEmailScreen() {
  const [email, setEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const hasRoutedAway = useRef(false);

  const routeAfterVerification = useCallback(async (user: User) => {
    if (hasRoutedAway.current) {
      return;
    }
    hasRoutedAway.current = true;
    try {
      router.replace(await getPostAuthRouteForUser(user));
    } catch {
      router.replace('/profile-setup');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (!user) {
        if (!hasRoutedAway.current) {
          hasRoutedAway.current = true;
          router.replace('/sign-in');
        }
        return;
      }

      setEmail(user.email ?? '');

      if (user.emailVerified) {
        void routeAfterVerification(user);
      }
    });

    return unsubscribe;
  }, [routeAfterVerification]);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || hasRoutedAway.current) {
        return;
      }
      try {
        const refreshed = await reloadCurrentUser();
        if (refreshed?.emailVerified) {
          void routeAfterVerification(refreshed);
        }
      } catch {
        // Background polling errors are silent on purpose.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [routeAfterVerification]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  async function handleCheckNow() {
    setErrorMessage('');
    setStatusMessage('');
    setLoadingAction('check');
    try {
      const refreshed = await reloadCurrentUser();
      if (!refreshed) {
        setErrorMessage('You are not signed in. Please sign in again.');
        return;
      }
      if (refreshed.emailVerified) {
        await routeAfterVerification(refreshed);
        return;
      }
      setStatusMessage('Still waiting on the email confirmation. Open the link in your inbox.');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) {
      return;
    }
    setErrorMessage('');
    setStatusMessage('');
    setLoadingAction('resend');
    try {
      await sendVerificationEmailToCurrentUser();
      setStatusMessage('Verification email sent. Check spam if it does not appear.');
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSignOut() {
    setLoadingAction('sign-out');
    try {
      await signOut();
      hasRoutedAway.current = true;
      router.replace('/welcome');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  const isBusy = loadingAction !== null;
  const resendLabel =
    resendCountdown > 0 ? `Resend email in ${resendCountdown}s` : 'Resend verification email';

  return (
    <Screen
      eyebrow="Verify your email"
      title="Confirm your email to continue"
      description="Tap the link we sent to your inbox. We will move you forward as soon as it is verified."
      footer={
        <>
          <ActionButton
            label="I've verified, check now"
            loading={loadingAction === 'check'}
            loadingLabel="Checking"
            onPress={handleCheckNow}
          />
          <ActionButton
            disabled={resendCountdown > 0 || isBusy}
            label={resendLabel}
            loading={loadingAction === 'resend'}
            loadingLabel="Sending"
            onPress={handleResend}
            variant="secondary"
          />
          <ActionButton
            disabled={isBusy}
            label="Use a different account"
            loading={loadingAction === 'sign-out'}
            loadingLabel="Signing out"
            onPress={handleSignOut}
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Verification sent to</Text>
        <Text style={styles.cardEmail}>{email || 'your email address'}</Text>
        <Text style={styles.cardBody}>
          Medifind checks every {Math.round(POLL_INTERVAL_MS / 1000)} seconds and routes you forward
          automatically once your email is confirmed.
        </Text>
      </View>

      {statusMessage ? (
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Action needed</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardLabel: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  cardEmail: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '600',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  infoPanel: {
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.primary700,
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
});
