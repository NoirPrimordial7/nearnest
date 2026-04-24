import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function ProfileSetupScreen() {
  return (
    <Screen
      eyebrow="Profile setup"
      title="Set your search preferences"
      description="Add the basics Medifind will use for saved areas and discovery. This is placeholder UI only."
      footer={<ActionButton label="Continue" onPress={() => router.replace('/home')} />}
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
          />
        </View>
        <InfoCard
          title="Preferred search radius"
          body="MVP will use a nearby-store radius. Delivery preferences stay out of scope."
        />
        <View style={styles.radiusRow}>
          <Text style={styles.radiusChip}>2 km</Text>
          <Text style={[styles.radiusChip, styles.radiusChipActive]}>5 km</Text>
          <Text style={styles.radiusChip}>10 km</Text>
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
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radiusChip: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textMuted,
    fontSize: typography.bodySm,
    fontWeight: '500',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  radiusChipActive: {
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
    color: colors.primary700,
  },
});
