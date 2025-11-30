import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends ViewProps {
  orientation?: DividerOrientation;
  spacing?: keyof typeof Spacing;
  thickness?: number;
}

export function Divider({
  orientation = 'horizontal',
  spacing = 'md',
  thickness = 1,
  style,
  ...props
}: DividerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.divider,
          [isHorizontal ? 'height' : 'width']: thickness,
          [isHorizontal ? 'marginVertical' : 'marginHorizontal']: Spacing[spacing],
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    alignSelf: 'stretch',
  },
});
