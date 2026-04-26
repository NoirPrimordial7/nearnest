import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

type BottomSheetProps = {
  children: ReactNode;
};

export function BottomSheet({ children }: BottomSheetProps) {
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    gap: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderSoft,
  },
});
