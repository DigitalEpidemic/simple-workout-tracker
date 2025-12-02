/**
 * Analytics Screen
 *
 * Displays workout analytics including:
 * - Summary statistics (total workouts, volume, PRs)
 * - Volume chart over time
 * - Exercise progression chart (for selected exercise)
 * - PR timeline chart
 *
 * Features:
 * - Time range selector (7 days, 30 days, 90 days, 1 year, all time)
 * - Exercise selector for progression chart
 * - Interactive charts with tooltips
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ExerciseProgressionChart } from "@/src/features/analytics/components/ExerciseProgressionChart";
import { ExerciseSelector } from "@/src/features/analytics/components/ExerciseSelector";
import { FilterSelector } from "@/src/features/analytics/components/FilterSelector";
import { PRTimelineChart } from "@/src/features/analytics/components/PRTimelineChart";
import { SectionHeader } from "@/src/features/analytics/components/SectionHeader";
import { StatCard } from "@/src/features/analytics/components/StatCard";
import {
  TimeRange,
  TimeRangeSelector,
} from "@/src/features/analytics/components/TimeRangeSelector";
import { VolumeChart } from "@/src/features/analytics/components/VolumeChart";
import { AnalyticsFilter, DEFAULT_ANALYTICS_FILTER } from "@/src/features/analytics/types/filters";
import { useWeightDisplay } from "@/src/hooks/useWeightDisplay";
import {
  ExerciseProgressionPoint,
  getAverageWorkoutDuration,
  getExerciseProgression,
  getPRCount,
  getPRTimeline,
  getTotalVolume,
  getTotalWorkoutCount,
  getUniqueExerciseNames,
  getVolumeOverTime,
  PRTimelinePoint,
  VolumeDataPoint,
} from "@/src/lib/db/repositories/analytics";

/**
 * Get date range based on selected time range
 */
function getDateRange(range: TimeRange): {
  startDate: number;
  endDate: number;
} {
  const now = Date.now();
  const endDate = now;
  let startDate = 0;

  switch (range) {
    case "7d":
      startDate = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case "30d":
      startDate = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case "90d":
      startDate = now - 90 * 24 * 60 * 60 * 1000;
      break;
    case "1y":
      startDate = now - 365 * 24 * 60 * 60 * 1000;
      break;
    case "all":
      startDate = 0;
      break;
  }

  return { startDate, endDate };
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { convertWeight, getUnit } = useWeightDisplay();

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilter>(DEFAULT_ANALYTICS_FILTER);

  // Stats
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [avgDuration, setAvgDuration] = useState<number>(0);
  const [prCount, setPRCount] = useState<number>(0);

  // Chart data
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [progressionData, setProgressionData] = useState<
    ExerciseProgressionPoint[]
  >([]);
  const [prTimelineData, setPRTimelineData] = useState<PRTimelinePoint[]>([]);

  const [loading, setLoading] = useState(true);

  // Load exercise list on mount or when filter changes
  useEffect(() => {
    loadExerciseList();
  }, [filter]);

  // Load analytics data when time range, selected exercise, or filter changes
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedExercise, filter]);

  async function loadExerciseList() {
    try {
      const exercises = await getUniqueExerciseNames(filter);
      setExerciseList(exercises);
      if (exercises.length > 0 && !selectedExercise) {
        setSelectedExercise(exercises[0]);
      }
    } catch (error) {
      console.error("Failed to load exercise list:", error);
    }
  }

  async function loadAnalyticsData() {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(timeRange);

      // Load stats
      const [workouts, volume, duration, prs] = await Promise.all([
        getTotalWorkoutCount(startDate, endDate, filter),
        getTotalVolume(startDate, endDate, filter),
        getAverageWorkoutDuration(startDate, endDate, filter),
        getPRCount(startDate, endDate, filter),
      ]);

      setTotalWorkouts(workouts);
      setTotalVolume(volume);
      setAvgDuration(duration);
      setPRCount(prs);

      // Load chart data
      const [volumeChartData, prTimeline] = await Promise.all([
        getVolumeOverTime(startDate, endDate, filter),
        getPRTimeline(startDate, endDate, filter),
      ]);

      setVolumeData(volumeChartData);
      setPRTimelineData(prTimeline);

      // Load progression data for selected exercise
      if (selectedExercise) {
        const progression = await getExerciseProgression(selectedExercise, 50, filter);
        setProgressionData(progression);
      } else {
        setProgressionData([]);
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      Alert.alert("Error", "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title">Analytics</ThemedText>
          <ThemedText style={styles.subtitle}>Track your progress</ThemedText>
        </ThemedView>

        {/* Time Range Selector */}
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />

        {/* Filter Selector */}
        <FilterSelector
          selectedFilter={filter}
          onFilterChange={setFilter}
        />

        {/* Summary Stats Section */}
        <SectionHeader
          title="Summary"
          subtitle="Stats for selected time range"
        />
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatCard label="Workouts" value={totalWorkouts} />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                label={`Volume (${getUnit()})`}
                value={Math.round(convertWeight(totalVolume)).toLocaleString()}
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatCard label="PRs" value={prCount} />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                label="Avg Workout"
                value={formatDuration(avgDuration)}
              />
            </View>
          </View>
        </View>

        {/* Volume Over Time Section */}
        <VolumeChart
          data={volumeData}
          subtitle="Total weight lifted per workout"
        />

        {/* PR Timeline Section */}
        <PRTimelineChart data={prTimelineData} subtitle="Your PRs over time" />

        {/* View All PRs Button */}
        {prCount > 0 && (
          <View style={styles.viewAllContainer}>
            <Pressable
              onPress={() => router.push("/pr-history")}
              style={[
                styles.viewAllButton,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <ThemedText
                style={[styles.viewAllText, { color: colors.primary }]}
              >
                View All Personal Records
              </ThemedText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        )}

        {/* Exercise Progression Section */}
        {exerciseList.length > 0 && (
          <>
            <SectionHeader
              title="Exercise Progression"
              subtitle="Track weight progression for a specific exercise"
            />
            <View style={styles.selectorContainer}>
              <ExerciseSelector
                exercises={exerciseList}
                selectedExercise={selectedExercise}
                onSelectExercise={setSelectedExercise}
              />
            </View>
            {selectedExercise && (
              <ExerciseProgressionChart
                data={progressionData}
                exerciseName={selectedExercise}
              />
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && totalWorkouts === 0 && (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Complete some workouts to see your analytics!
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCardWrapper: {
    flex: 1,
  },
  selectorContainer: {
    paddingHorizontal: Spacing.md,
  },
  viewAllContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  viewAllText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.5,
    fontSize: 16,
  },
});
