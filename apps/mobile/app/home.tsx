import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function HomeScreen() {
  return (
    <Screen
      eyebrow="Discovery MVP"
      title="Find a medicine nearby"
      description="Placeholder Home for the Medifind search to store to navigation flow."
      footer={
        <ActionButton
          label="Preview onboarding"
          variant="secondary"
          onPress={() => router.replace('/welcome')}
        />
      }
    >
      <View style={styles.searchBox}>
        <Text style={styles.searchLabel}>Search medicine, salt, or strength</Text>
      </View>
      <View style={styles.cardStack}>
        <InfoCard
          title="Verified nearby stores"
          body="Store cards will show distance, open state, public contact, and availability freshness."
        />
        <InfoCard
          title="Call or navigate"
          body="Primary actions stay focused on store contact and native maps directions. Delivery is Phase 2."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  searchLabel: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  cardStack: {
    gap: spacing.md,
  },
});
