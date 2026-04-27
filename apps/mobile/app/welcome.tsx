import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

const slides = [
  {
    icon: '01',
    title: 'Find the medicine you need',
    body: 'Search by brand, salt, strength, or form.',
  },
  {
    icon: '02',
    title: 'See nearby verified stores',
    body: 'Compare distance, open status, price, and latest availability.',
  },
  {
    icon: '03',
    title: 'Call or navigate before you go',
    body: 'Confirm with the store, then preview the route inside Medifind.',
  },
];

export default function WelcomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];
  const isLastSlide = activeSlide === slides.length - 1;

  function handlePrimaryPress() {
    if (isLastSlide) {
      router.push('/sign-up');
      return;
    }

    setActiveSlide((current) => current + 1);
  }

  return (
    <Screen
      eyebrow="Medifind"
      title="Find nearby medicines faster"
      description="A calm, focused way to compare nearby verified stores before you travel."
      footer={
        <>
          <ActionButton
            label={isLastSlide ? 'Get started' : 'Next'}
            onPress={handlePrimaryPress}
          />
          <ActionButton
            label="Already have an account? Sign in"
            variant="ghost"
            onPress={() => router.push('/sign-in')}
          />
        </>
      }
    >
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{slide.icon}</Text>
        </View>
        <View style={styles.copyGroup}>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideBody}>{slide.body}</Text>
        </View>
      </View>

      <View style={styles.dots} accessibilityLabel={`Onboarding step ${activeSlide + 1} of 3`}>
        {slides.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show onboarding step ${index + 1}: ${item.title}`}
            key={item.title}
            onPress={() => setActiveSlide(index)}
            style={[styles.dot, index === activeSlide && styles.activeDot]}
          />
        ))}
      </View>

      <View style={styles.promisePanel}>
        <Text style={styles.promiseTitle}>MVP focus</Text>
        <Text style={styles.promiseBody}>
          Medifind helps you search, compare availability, call a store, and preview the route.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xxxl,
    gap: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
  },
  iconText: {
    color: colors.primary700,
    fontSize: typography.h3,
    fontWeight: '600',
  },
  copyGroup: {
    gap: spacing.md,
  },
  slideTitle: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: '600',
    lineHeight: 40,
    textAlign: 'center',
  },
  slideBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 22,
    backgroundColor: colors.primary500,
  },
  promisePanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.primary50,
    marginTop: spacing.xxxl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  promiseTitle: {
    color: colors.primary700,
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  promiseBody: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
});
