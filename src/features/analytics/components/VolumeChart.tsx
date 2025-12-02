/**
 * VolumeChart Component
 *
 * Displays total workout volume (reps × weight) over time as a line chart.
 */

import React from 'react';
import { StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';

export interface VolumeDataPoint {
  date: number; // Unix timestamp
  totalVolume: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  title?: string;
  subtitle?: string;
}

export function VolumeChart({ data, title = 'Volume Over Time', subtitle }: VolumeChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenWidth = Dimensions.get('window').width;
  const { convertWeight } = useWeightDisplay();

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No data available</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Prepare data for chart
  const labels = data.map((point) => {
    const date = new Date(point.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // Convert volume from lbs (storage) to user's preferred unit for display
  const values = data.map((point) => Math.round(convertWeight(point.totalVolume)));

  const chartData = {
    labels: labels.length > 6 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
    datasets: [
      {
        data: values,
      },
    ],
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: colors.background,
          backgroundGradientFrom: colors.backgroundSecondary,
          backgroundGradientTo: colors.backgroundSecondary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => colorScheme === 'dark'
            ? `rgba(156, 163, 175, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: BorderRadius.lg,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
          },
        }}
        bezier
        style={styles.chart}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});
