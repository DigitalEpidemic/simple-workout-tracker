/**
 * FilterSelector Component - Phase 8.6
 *
 * Future component for filtering analytics by workout type.
 * This is a placeholder/example implementation.
 *
 * TODO Phase 8.6.2: Implement this component when ready to add filtering
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnalyticsFilter, AnalyticsFilterType, getFilterLabel } from '../types/filters';

export interface FilterSelectorProps {
  selectedFilter: AnalyticsFilter;
  onFilterChange: (filter: AnalyticsFilter) => void;
  availablePrograms?: Array<{ id: string; name: string }>; // For program dropdown
}

/**
 * Segmented control style filter selector
 *
 * Shows: All | Programs | Templates | Free
 *
 * TODO: Add program picker when "Programs" is selected
 */
export function FilterSelector({
  selectedFilter,
  onFilterChange,
  availablePrograms = [],
}: FilterSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const filterTypes: AnalyticsFilterType[] = ['all', 'program', 'template', 'free'];

  const handleFilterPress = (type: AnalyticsFilterType) => {
    onFilterChange({ type });
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Filter By</ThemedText>
      <View style={[styles.segmentedControl, { backgroundColor: colors.backgroundSecondary }]}>
        {filterTypes.map((type) => {
          const isSelected = selectedFilter.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => handleFilterPress(type)}
              style={[
                styles.segment,
                isSelected && { backgroundColor: colors.primary },
              ]}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {getFilterLabel({ type })}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* TODO: Add program picker when selectedFilter.type === 'program' */}
      {selectedFilter.type === 'program' && availablePrograms.length > 0 && (
        <View style={styles.programPicker}>
          <ThemedText style={[styles.pickerLabel, { color: colors.textSecondary }]}>
            Select a program to filter (not yet implemented)
          </ThemedText>
          {/* TODO: Implement program picker dropdown */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  programPicker: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFF3CD',
  },
  pickerLabel: {
    fontSize: FontSizes.sm,
  },
});
