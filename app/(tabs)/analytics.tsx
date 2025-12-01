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

import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { ExerciseProgressionChart } from "@/src/features/analytics/components/ExerciseProgressionChart";
import { PRTimelineChart } from "@/src/features/analytics/components/PRTimelineChart";
import { StatCard } from "@/src/features/analytics/components/StatCard";
import {
  TimeRange,
  TimeRangeSelector,
} from "@/src/features/analytics/components/TimeRangeSelector";
import { VolumeChart } from "@/src/features/analytics/components/VolumeChart";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseList, setExerciseList] = useState<string[]>([]);

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

  // Load exercise list on mount
  useEffect(() => {
    loadExerciseList();
  }, []);

  // Load analytics data when time range or selected exercise changes
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedExercise]);

  async function loadExerciseList() {
    try {
      const exercises = await getUniqueExerciseNames();
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
        getTotalWorkoutCount(startDate, endDate),
        getTotalVolume(startDate, endDate),
        getAverageWorkoutDuration(startDate, endDate),
        getPRCount(startDate, endDate),
      ]);

      setTotalWorkouts(workouts);
      setTotalVolume(volume);
      setAvgDuration(duration);
      setPRCount(prs);

      // Load chart data
      const [volumeChartData, prTimeline] = await Promise.all([
        getVolumeOverTime(startDate, endDate),
        getPRTimeline(startDate, endDate),
      ]);

      setVolumeData(volumeChartData);
      setPRTimelineData(prTimeline);

      // Load progression data for selected exercise
      if (selectedExercise) {
        const progression = await getExerciseProgression(selectedExercise, 50);
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

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatCard
                label="Workouts"
                value={totalWorkouts}
                subtitle="sessions"
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                label="Total Volume"
                value={totalVolume.toLocaleString()}
                subtitle="lbs"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatCard label="PRs" value={prCount} subtitle="crushed" />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                label="Avg Duration"
                value={formatDuration(avgDuration)}
                subtitle="per workout"
              />
            </View>
          </View>
        </View>

        {/* Volume Chart */}
        <VolumeChart data={volumeData} />

        {/* Exercise Selector */}
        {exerciseList.length > 0 && (
          <ThemedView style={styles.pickerContainer}>
            <ThemedText style={styles.pickerLabel}>Select Exercise:</ThemedText>
            <View
              style={[
                styles.picker,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Picker
                selectedValue={selectedExercise}
                onValueChange={(value: string) => setSelectedExercise(value)}
                style={{ color: colors.text }}
              >
                {exerciseList.map((exercise) => (
                  <Picker.Item
                    key={exercise}
                    label={exercise}
                    value={exercise}
                  />
                ))}
              </Picker>
            </View>
          </ThemedView>
        )}

        {/* Exercise Progression Chart */}
        {selectedExercise && (
          <ExerciseProgressionChart
            data={progressionData}
            exerciseName={selectedExercise}
          />
        )}

        {/* PR Timeline Chart */}
        <PRTimelineChart data={prTimelineData} />

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
  pickerContainer: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
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
