/**
 * TimeRangeSelector Component
 *
 * Allows users to select a time range for analytics data.
 * Options: 7 days, 30 days, 90 days, 1 year, All time
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

export function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      {TIME_RANGE_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.button,
              {
                backgroundColor: isSelected ? colors.primary : colors.backgroundTertiary,
              },
            ]}
            onPress={() => onChange(option.value)}
          >
            <ThemedText
              style={[
                styles.buttonText,
                {
                  color: isSelected ? colors.textInverse : colors.text,
                },
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
