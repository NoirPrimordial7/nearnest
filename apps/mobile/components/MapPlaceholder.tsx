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

  return (
    <View accessibilityElementsHidden style={styles.map}>
      <View style={styles.gridLineHorizontal} />
      <View style={styles.gridLineVertical} />
      <Text style={[styles.title, { fontSize: scale(typography.h3), lineHeight: scaleLineHeight(24) }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) }]}>
        Map preview placeholder. Navigation opens your maps app.
      </Text>
      {stores.slice(0, 12).map((store, index) => (
        <View
          key={store.id}
          style={[
            styles.dot,
            {
              left: `${16 + ((index * 17) % 68)}%`,
              top: `${24 + ((index * 23) % 52)}%`,
              opacity: store.verified ? 1 : 0.45,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    minHeight: 260,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xxl,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 1,
    backgroundColor: colors.border,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 1,
    backgroundColor: colors.border,
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary500,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 240,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
