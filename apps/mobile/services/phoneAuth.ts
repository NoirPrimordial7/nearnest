export const phoneOtpUnavailableMessage =
  'Phone OTP is not enabled in this Expo build. Firebase JS SDK phone auth requires a supported reCAPTCHA verifier; the old Expo reCAPTCHA package is archived, so this needs a separate approved implementation path.';

export function normalizeIndianMobileNumber(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (value.trim().startsWith('+')) {
    return value.trim();
  }

  return '';
}
