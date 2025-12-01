import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  ComponentTokens,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps['style'];
}

export function Input({
  label,
  error,
  helperText,
  size = 'md',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  const getBorderColor = () => {
    if (hasError) return colors.error;
    if (isFocused) return colors.borderFocus;
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (!editable) return colors.backgroundTertiary;
    return colors.background;
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: FontSizes.sm,
              fontWeight: FontWeights.medium,
              marginBottom: Spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            height: ComponentTokens.input.height[size],
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            paddingHorizontal: ComponentTokens.input.paddingHorizontal,
          },
          !editable && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: size === 'sm' ? FontSizes.sm : size === 'lg' ? FontSizes.lg : FontSizes.base,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          {...props}
        />

        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>

      {error && (
        <Text
          style={[
            styles.helperText,
            {
              color: colors.error,
              fontSize: FontSizes.xs,
              marginTop: Spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text
          style={[
            styles.helperText,
            {
              color: colors.textSecondary,
              fontSize: FontSizes.xs,
              marginTop: Spacing.xs,
            },
          ]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 0,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  helperText: {},
  disabled: {
    opacity: 0.6,
  },
});
