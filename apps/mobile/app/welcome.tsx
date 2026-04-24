import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { colors, radius, spacing } from '../theme/tokens';

const slides = [
  {
    title: 'Find the medicine you need',
    body: 'Search by brand, salt, strength, or form.',
  },
  {
    title: 'See nearby verified stores',
    body: 'Compare distance, open status, price, and latest availability.',
  },
  {
    title: 'Call or navigate before you go',
    body: 'Confirm with the store, then open directions in your maps app.',
  },
];

export default function WelcomeScreen() {
  return (
    <Screen
      eyebrow="Medifind"
      title="Find nearby medicines faster"
      description="This placeholder mirrors the MVP onboarding copy without enabling auth or backend calls yet."
      footer={
        <>
          <ActionButton label="Get started" onPress={() => router.push('/sign-up')} />
          <ActionButton
            label="Already have an account? Sign in"
            variant="ghost"
            onPress={() => router.push('/sign-in')}
          />
        </>
      }
    >
      <View style={styles.slideStack}>
        {slides.map((slide, index) => (
          <InfoCard key={slide.title} title={`${index + 1}. ${slide.title}`} body={slide.body} />
        ))}
      </View>
      <View style={styles.dots} accessibilityLabel="Onboarding progress placeholder">
        <View style={styles.activeDot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slideStack: {
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary500,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
});
