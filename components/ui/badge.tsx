import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends ViewProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  text,
  variant = 'neutral',
  size = 'md',
  style,
  ...props
}: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primaryLight;
      case 'success':
        return colors.successLight;
      case 'error':
        return colors.errorLight;
      case 'warning':
        return colors.warningLight;
      case 'info':
        return colors.infoLight;
      case 'neutral':
      default:
        return colors.backgroundTertiary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      case 'neutral':
      default:
        return colors.text;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs / 2 };
      case 'lg':
        return { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs };
      case 'md':
      default:
        return { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs - 1 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return FontSizes.xs;
      case 'lg':
        return FontSizes.base;
      case 'md':
      default:
        return FontSizes.sm;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: BorderRadius.full,
          ...getPadding(),
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: FontWeights.medium,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});
