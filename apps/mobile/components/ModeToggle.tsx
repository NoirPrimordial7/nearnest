import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';
import type { DiscoveryMode } from '../types/discovery';

type ModeToggleProps = {
  value: DiscoveryMode;
  onChange: (value: DiscoveryMode) => void;
};

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <View style={styles.shell}>
      <ModeButton label="Medicine" mode="medicine" selected={value === 'medicine'} onPress={onChange} />
      <ModeButton label="Medical Stores" mode="stores" selected={value === 'stores'} onPress={onChange} />
    </View>
  );
}

function ModeButton({
  label,
  mode,
  selected,
  onPress,
}: {
  label: string;
  mode: DiscoveryMode;
  selected: boolean;
  onPress: (mode: DiscoveryMode) => void;
}) {
  const { scale, scaleLineHeight } = useFontScale();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(mode)}
      style={({ pressed }) => [
        styles.segment,
        selected && styles.segmentSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          selected && styles.segmentTextSelected,
          { fontSize: scale(typography.bodySm), lineHeight: scaleLineHeight(18) },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 48,
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: {
    opacity: 0.84,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: colors.text,
  },
});
