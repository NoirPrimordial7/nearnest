import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInput as TextInputType } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { normalizeIndianMobileNumber, phoneOtpUnavailableMessage } from '../services/phoneAuth';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function PhoneOtpScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [formError, setFormError] = useState(phoneOtpUnavailableMessage);
  const otpInputRef = useRef<TextInputType>(null);

  function handleSendCode() {
    const normalizedPhone = normalizeIndianMobileNumber(phoneNumber);

    if (!normalizedPhone) {
      setFormError('Enter a valid mobile number.');
      return;
    }

    setFormError(phoneOtpUnavailableMessage);
  }

  return (
    <Screen
      eyebrow="Phone OTP"
      title="Verify your phone"
      description="Use a number you can access. Medifind will send a one-time code when Phone OTP is enabled."
      footer={
        <>
          <ActionButton label="Send code" onPress={handleSendCode} />
          <ActionButton
            label="Use email instead"
            onPress={() => router.replace('/sign-in')}
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.stepText}>1 of 2</Text>
          <Text style={styles.label}>Mobile number</Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
            placeholder="98765 43210"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={phoneNumber}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.stepText}>2 of 2</Text>
          <Text style={styles.label}>Verification code</Text>
          <Pressable onPress={() => otpInputRef.current?.focus()} style={styles.otpRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.otpBox}>
                <Text style={styles.otpText}>{otp[index] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setOtp}
            ref={otpInputRef}
            style={styles.hiddenOtpInput}
            value={otp}
          />
        </View>

        <Pressable
          onPress={() => {
            setPhoneNumber('');
            setOtp('');
          }}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>Change number</Text>
        </Pressable>

        <View style={styles.warningPanel}>
          <Text style={styles.warningTitle}>Phone OTP deferred</Text>
          <Text style={styles.warningText}>{formError}</Text>
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
  stepText: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
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
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  otpBox: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  otpText: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '600',
  },
  hiddenOtpInput: {
    height: 1,
    opacity: 0,
  },
  secondaryAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.primary700,
    fontSize: typography.bodySm,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningPanel: {
    borderWidth: 1,
    borderColor: colors.rxBorder,
    borderRadius: radius.md,
    backgroundColor: colors.rxBg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  warningTitle: {
    color: colors.rxText,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  warningText: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
