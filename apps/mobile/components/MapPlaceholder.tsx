import { StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { Store } from '../types/discovery';

type MapPlaceholderProps = {
  stores: Store[];
  title?: string;
};

export function MapPlaceholder({ stores, title = 'Pharmacies near you' }: MapPlaceholderProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const visibleStores = stores.slice(0, 8);

  return (
    <View accessibilityElementsHidden style={styles.map}>
      <View style={styles.softPatchOne} />
      <View style={styles.softPatchTwo} />
      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />
      <View style={styles.roadDiagonal} />
      <View style={styles.routeSegmentOne} />
      <View style={styles.routeSegmentTwo} />
      <View style={styles.routeSegmentThree} />

      <View style={styles.userPin}>
        <Text style={styles.userPinText}>You</Text>
      </View>

      {visibleStores.map((store, index) => (
        <View
          key={store.id}
          style={[
            styles.pin,
            store.verified ? styles.pinVerified : styles.pinUnverified,
            {
              left: `${16 + ((index * 17) % 68)}%`,
              top: `${24 + ((index * 23) % 52)}%`,
            },
          ]}
        >
          <View style={styles.pinCore} />
        </View>
      ))}

      <View style={styles.infoPanel}>
        <View style={styles.infoHeader}>
          <Text style={[styles.title, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
            {title}
          </Text>
          <View style={styles.countChip}>
            <Text style={styles.countText}>{stores.length} stores</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
          In-app map preview with nearby verified pharmacies and route context.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    minHeight: 260,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.primary50,
    padding: spacing.lg,
  },
  softPatchOne: {
    position: 'absolute',
    right: -28,
    top: -22,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.surface,
    opacity: 0.68,
  },
  softPatchTwo: {
    position: 'absolute',
    left: -34,
    bottom: -26,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primary100,
    opacity: 0.6,
  },
  roadHorizontal: {
    position: 'absolute',
    left: -12,
    right: -12,
    top: '46%',
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.84,
  },
  roadVertical: {
    position: 'absolute',
    top: -18,
    bottom: -18,
    left: '44%',
    width: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.74,
  },
  roadDiagonal: {
    position: 'absolute',
    left: '9%',
    top: '24%',
    width: '88%',
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: 0.62,
    transform: [{ rotate: '-21deg' }],
  },
  routeSegmentOne: {
    position: 'absolute',
    left: '20%',
    top: '62%',
    width: '28%',
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '-18deg' }],
  },
  routeSegmentTwo: {
    position: 'absolute',
    left: '44%',
    top: '51%',
    width: '24%',
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '-44deg' }],
  },
  routeSegmentThree: {
    position: 'absolute',
    left: '62%',
    top: '36%',
    width: '18%',
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent500,
    transform: [{ rotate: '12deg' }],
  },
  userPin: {
    position: 'absolute',
    left: '12%',
    bottom: '24%',
    minWidth: 48,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.text,
  },
  userPinText: {
    color: colors.textInvert,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  pin: {
    position: 'absolute',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  pinVerified: {
    backgroundColor: colors.primary500,
  },
  pinUnverified: {
    backgroundColor: colors.textSoft,
  },
  pinCore: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  infoPanel: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  countChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  countText: {
    color: colors.primary700,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
  },
});
