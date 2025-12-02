/**
 * PRTimelineChart Component
 *
 * Displays personal records achieved over time as a bar chart.
 * Shows PR count by date.
 */

import React from 'react';
import { StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export interface PRDataPoint {
  date: number; // Unix timestamp
  exerciseName: string;
  weight: number;
  reps: number;
}

interface PRTimelineChartProps {
  data: PRDataPoint[];
  title?: string;
  subtitle?: string;
}

export function PRTimelineChart({ data, title = 'Personal Records', subtitle }: PRTimelineChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenWidth = Dimensions.get('window').width;

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No PRs achieved yet</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Group PRs by date to show count per day
  const prsByDate = data.reduce((acc, pr) => {
    const dateKey = new Date(pr.date).toLocaleDateString();
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dates = Object.keys(prsByDate).slice(-10); // Last 10 dates with PRs
  const counts = dates.map((date) => prsByDate[date]);

  const labels = dates.map((dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const chartData = {
    labels: labels.length > 6 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
    datasets: [
      {
        data: counts.length > 0 ? counts : [0],
      },
    ],
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.subtitle}>
        {subtitle || `${data.length} total PR${data.length !== 1 ? 's' : ''} achieved`}
      </ThemedText>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" PRs"
        chartConfig={{
          backgroundColor: colors.background,
          backgroundGradientFrom: colors.backgroundSecondary,
          backgroundGradientTo: colors.backgroundSecondary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
          labelColor: (opacity = 1) => colorScheme === 'dark'
            ? `rgba(156, 163, 175, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: BorderRadius.lg,
          },
        }}
        style={styles.chart}
        showValuesOnTopOfBars
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
    fontSize: 14,
    opacity: 0.7,
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
