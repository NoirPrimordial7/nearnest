import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { subscribeToAuthState } from '../services/auth';
import { getPostAuthRouteForUser } from '../services/userProfile';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0.92)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 320,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        duration: 320,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const startedAt = Date.now();
    let isActive = true;
    let routeTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = subscribeToAuthState((user) => {
      if (hasNavigated.current) {
        return;
      }

      const remainingSplashTime = Math.max(0, 900 - (Date.now() - startedAt));

      routeTimer = setTimeout(async () => {
        if (!isActive || hasNavigated.current) {
          return;
        }

        if (!user) {
          hasNavigated.current = true;
          router.replace('/welcome');
          return;
        }

        try {
          const nextRoute = await getPostAuthRouteForUser(user);
          if (!isActive || hasNavigated.current) {
            return;
          }

          hasNavigated.current = true;
          router.replace(nextRoute);
        } catch {
          // If Firestore is unreachable on cold start, do not strand the user on splash.
          // Send them to profile-setup; it will retry the load on its own.
          if (!isActive || hasNavigated.current) {
            return;
          }
          hasNavigated.current = true;
          router.replace('/profile-setup');
        }
      }, remainingSplashTime);
    });

    return () => {
      isActive = false;
      if (routeTimer) {
        clearTimeout(routeTimer);
      }
      unsubscribe();
    };
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.brandGroup, { opacity, transform: [{ scale }] }]}>
        <View style={styles.brandMark}>
          <Text style={styles.brandInitial}>M</Text>
        </View>
        <Text style={styles.wordmark}>Medifind</Text>
        <Text style={styles.tagline}>Find nearby medicines faster.</Text>
      </Animated.View>
      <View style={styles.statusGroup}>
        <View style={styles.dots} accessibilityLabel="Loading Medifind">
          <View style={[styles.dot, styles.dotStrong]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.status}>Checking your session</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xxl,
  },
  brandGroup: {
    alignItems: 'center',
  },
  brandMark: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    marginBottom: spacing.md,
  },
  brandInitial: {
    color: colors.primary600,
    fontSize: typography.display,
    fontWeight: '600',
  },
  wordmark: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '600',
    lineHeight: 32,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: typography.bodySm,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  statusGroup: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxxl,
    left: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary300,
    opacity: 0.48,
  },
  dotStrong: {
    opacity: 1,
  },
  status: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
});
