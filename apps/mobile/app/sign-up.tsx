import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { getAuthErrorMessage, signInWithGoogleIdToken, signUpWithEmail } from '../services/auth';
import {
  getGoogleAuthUnavailableMessage,
  getGoogleNativeSignInErrorMessage,
  getNativeGoogleIdToken,
} from '../services/googleAuth';
import { getPostAuthRouteForUser } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type LoadingAction = 'email' | 'google' | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /\d/;

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

function validateForm(values: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Enter your full name.';
  }

  const trimmedEmail = values.email.trim();
  if (!trimmedEmail) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "That doesn't look like a valid email.";
  }

  if (!values.password) {
    errors.password = 'Choose a password.';
  } else if (values.password.length < PASSWORD_MIN) {
    errors.password = `Use at least ${PASSWORD_MIN} characters.`;
  } else if (!HAS_LETTER.test(values.password) || !HAS_NUMBER.test(values.password)) {
    errors.password = 'Include at least one letter and one number.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Re-enter your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!values.acceptedTerms) {
    errors.terms = 'Please accept the Terms and Privacy Policy.';
  }

  return errors;
}

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const fieldErrors = useMemo(
    () => validateForm({ fullName, email, password, confirmPassword, acceptedTerms }),
    [fullName, email, password, confirmPassword, acceptedTerms],
  );
  const isFormValid = Object.keys(fieldErrors).length === 0;
  const showFieldError = (key: keyof FieldErrors) =>
    submitAttempted ? fieldErrors[key] : undefined;

  async function handleCreateAccount() {
    setSubmitAttempted(true);
    setFormError('');

    if (!isFormValid) {
      return;
    }

    setLoadingAction('email');
    try {
      const result = await signUpWithEmail(email, password, fullName);
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

    setFormError('');
    setLoadingAction('google');

    try {
      const idToken = await getNativeGoogleIdToken();

      if (!idToken) {
        setLoadingAction(null);
        return;
      }

      const result = await signInWithGoogleIdToken(idToken);
      router.replace(await getPostAuthRouteForUser(result.user));
    } catch (error) {
      const googleMessage = getGoogleNativeSignInErrorMessage(error);
      setFormError(googleMessage || getAuthErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  const isBusy = loadingAction !== null;
  const createDisabled = isBusy || (submitAttempted && !isFormValid);

  return (
    <Screen
      eyebrow="Create account"
      title="Create your Medifind account"
      description="Save your search area and find verified pharmacies faster."
      footer={
        <>
          <ActionButton
            disabled={createDisabled}
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
            disabled
            label="Phone login coming soon"
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
            style={[styles.input, showFieldError('fullName') ? styles.inputError : null]}
            value={fullName}
          />
          {showFieldError('fullName') ? (
            <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isBusy}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSoft}
            style={[styles.input, showFieldError('email') ? styles.inputError : null]}
            value={email}
          />
          {showFieldError('email') ? (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputRow,
              showFieldError('password') ? styles.inputError : null,
            ]}
          >
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isBusy}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor={colors.textSoft}
              secureTextEntry={!showPassword}
              style={styles.inputInner}
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              disabled={isBusy}
              onPress={() => setShowPassword((current) => !current)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {showFieldError('password') ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : (
            <Text style={styles.helper}>
              At least 8 characters, with one letter and one number.
            </Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm password</Text>
          <View
            style={[
              styles.inputRow,
              showFieldError('confirmPassword') ? styles.inputError : null,
            ]}
          >
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isBusy}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textSoft}
              secureTextEntry={!showConfirmPassword}
              style={styles.inputInner}
              value={confirmPassword}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'
              }
              disabled={isBusy}
              onPress={() => setShowConfirmPassword((current) => !current)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {showFieldError('confirmPassword') ? (
            <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
          ) : null}
        </View>

        <View style={styles.termsBox}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="I agree to the Medifind Terms and Privacy Policy"
            accessibilityState={{ checked: acceptedTerms }}
            disabled={isBusy}
            hitSlop={8}
            onPress={() => setAcceptedTerms((current) => !current)}
            style={styles.checkboxHit}
          >
            <View style={[styles.checkbox, acceptedTerms ? styles.checkboxActive : null]}>
              {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
          </Pressable>
          <Text style={styles.terms}>
            I agree to the{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/terms')}
              style={styles.termsLink}
              suppressHighlighting
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/privacy')}
              style={styles.termsLink}
              suppressHighlighting
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
        {showFieldError('terms') ? (
          <Text style={styles.fieldError}>{fieldErrors.terms}</Text>
        ) : null}

        {formError ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Action needed</Text>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>
              We will email you a verification link after sign-up. Google sign-in is verified by
              the provider.
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  inputInner: {
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: colors.danger,
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  helper: {
    color: colors.textSoft,
    fontSize: typography.bodySm,
  },
  fieldError: {
    color: colors.danger,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  termsBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },
  checkboxHit: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.primary600,
    backgroundColor: colors.primary500,
  },
  checkboxMark: {
    color: colors.textInvert,
    fontSize: typography.bodySm,
    fontWeight: '700',
    lineHeight: 16,
  },
  terms: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary700,
    fontWeight: '600',
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
