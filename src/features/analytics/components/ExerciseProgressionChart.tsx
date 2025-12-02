/**
 * ExerciseProgressionChart Component
 *
 * Displays weight progression for a specific exercise over time.
 * Shows max weight used in each workout session.
 */

import React from 'react';
import { StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';

export interface ProgressionDataPoint {
  date: number; // Unix timestamp
  maxWeight: number;
}

interface ExerciseProgressionChartProps {
  data: ProgressionDataPoint[];
  exerciseName: string;
  title?: string;
}

export function ExerciseProgressionChart({
  data,
  exerciseName,
  title,
}: ExerciseProgressionChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenWidth = Dimensions.get('window').width;
  const { convertWeight, getUnit } = useWeightDisplay();

  const chartTitle = title ?? `${exerciseName} - Weight Progression`;

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>{chartTitle}</ThemedText>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>
            No data available for {exerciseName}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Group data by date and take the maximum weight for each date
  const dataByDate = data.reduce((acc, point) => {
    const date = new Date(point.date);
    const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;

    if (!acc[dateKey] || point.maxWeight > acc[dateKey].maxWeight) {
      acc[dateKey] = {
        dateKey,
        maxWeight: point.maxWeight,
        timestamp: point.date,
      };
    }

    return acc;
  }, {} as Record<string, { dateKey: string; maxWeight: number; timestamp: number }>);

  // Convert to arrays sorted by timestamp
  const groupedData = Object.values(dataByDate).sort((a, b) => a.timestamp - b.timestamp);
  const labels = groupedData.map((point) => point.dateKey);
  // Convert weights from lbs (storage) to user's preferred unit for display
  const values = groupedData.map((point) => convertWeight(point.maxWeight));

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
      <ThemedText style={styles.title}>{chartTitle}</ThemedText>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: colors.background,
          backgroundGradientFrom: colors.backgroundSecondary,
          backgroundGradientTo: colors.backgroundSecondary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          labelColor: (opacity = 1) => colorScheme === 'dark'
            ? `rgba(156, 163, 175, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: BorderRadius.lg,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.success,
          },
        }}
        bezier
        style={styles.chart}
        yAxisSuffix={` ${getUnit()}`}
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
    fontWeight: '600',
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
    textAlign: 'center',
  },
});
