import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useFontScale } from '../hooks/useFontScale';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

type SearchBarProps =
  | {
      variant: 'pressable';
      placeholder: string;
      onPress: () => void;
      value?: string;
    }
  | ({
      variant: 'input';
      value: string;
      onChangeText: (value: string) => void;
      onSubmitEditing?: () => void;
      placeholder: string;
    } & Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'placeholder'>);

export function SearchBar(props: SearchBarProps) {
  const { scale, scaleLineHeight } = useFontScale();
  const textStyle = {
    fontSize: scale(typography.body),
    lineHeight: scaleLineHeight(22),
  };

  if (props.variant === 'pressable') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={props.onPress}
        style={({ pressed }) => [styles.shell, pressed && styles.pressed]}
      >
        <Text style={[styles.searchIcon, textStyle]}>Search</Text>
        <Text style={[styles.placeholder, textStyle]} numberOfLines={1}>
          {props.value || props.placeholder}
        </Text>
      </Pressable>
    );
  }

  const {
    variant: _variant,
    value,
    onChangeText,
    onSubmitEditing,
    placeholder,
    ...inputProps
  } = props;
  void _variant;

  return (
    <View style={[styles.shell, styles.inputShell]}>
      <Text style={[styles.searchIcon, textStyle]}>Search</Text>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        returnKeyType="search"
        style={[styles.input, textStyle]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  inputShell: {
    borderColor: colors.primary300,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  searchIcon: {
    color: colors.primary700,
    fontWeight: '700',
  },
  placeholder: {
    flex: 1,
    color: colors.textSoft,
  },
  input: {
    flex: 1,
    minHeight: 54,
    color: colors.text,
    paddingVertical: 0,
  },
});
