import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWeightDisplay } from "@/src/hooks/useWeightDisplay";
import { fetchAllTemplates } from "@/src/features/templates/api/templateService";
import { getCompletedSessions } from "@/src/lib/db/repositories/sessions";
import { getActiveProgramInfo } from "@/src/features/programs/api/programService";
import { WorkoutTemplate, Program, ProgramDay } from "@/types";

/**
 * Home Screen - Main landing screen
 *
 * Features:
 * - Quick action buttons (Start Empty Workout, Choose Template)
 * - Quick stats overview
 * - Recent workout templates
 * - Continue workout button (if workout in progress)
 */
export default function HomeScreen() {
  const router = useRouter();
  const { convertWeight, getUnit } = useWeightDisplay();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [recentTemplates, setRecentTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<{
    program: Program;
    nextDay: ProgramDay;
  } | null>(null);

  // Use useFocusEffect to reload active program when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadActiveProgram();
    }, [])
  );

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadActiveProgram() {
    try {
      const programInfo = await getActiveProgramInfo();
      setActiveProgram(programInfo);
    } catch (error) {
      console.error("Failed to load active program:", error);
    }
  }

  async function loadHomeData() {
    try {
      // Get total completed workouts (with exercises to calculate volume)
      const allWorkouts = await getCompletedSessions(true);
      setTotalWorkouts(allWorkouts.length);

      // Calculate total workout duration
      const totalSeconds = allWorkouts.reduce((sum, workout) => {
        return sum + (workout.duration || 0);
      }, 0);
      setTotalDuration(totalSeconds);

      // Calculate total volume (sum of reps * weight for all sets)
      let volume = 0;
      for (const workout of allWorkouts) {
        for (const exercise of workout.exercises) {
          for (const set of exercise.sets) {
            if (set.completed) {
              volume += set.reps * set.weight;
            }
          }
        }
      }
      setTotalVolume(volume);

      // Get recent templates (sorted by lastUsed)
      const templates = await fetchAllTemplates();
      const sorted = templates
        .filter((t) => t.lastUsed !== undefined)
        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
        .slice(0, 5);
      setRecentTemplates(sorted);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      const remainingMonths = Math.floor((days % 365) / 30);
      return remainingMonths > 0
        ? `${years}y ${remainingMonths}mo`
        : `${years}y`;
    }
    if (months > 0) {
      const remainingDays = days % 30;
      return remainingDays > 0
        ? `${months}mo ${remainingDays}d`
        : `${months}mo`;
    }
    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    return `${minutes}m`;
  }

  function formatVolume(volume: number): string {
    // Convert volume from lbs (storage) to user's preferred unit
    const convertedVolume = Math.round(convertWeight(volume));

    if (convertedVolume >= 1000000) {
      return `${(convertedVolume / 1000000).toFixed(1)}M`;
    }
    if (convertedVolume >= 1000) {
      return `${(convertedVolume / 1000).toFixed(1)}K`;
    }
    return convertedVolume.toLocaleString();
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Workout Tracker</ThemedText>
        <ThemedText style={styles.subtitle}>Ready to train?</ThemedText>
      </ThemedView>
      <ScrollView style={styles.scrollView}>
        {/* Lifetime Stats */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Lifetime Stats</ThemedText>
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue} numberOfLines={1}>
                {loading ? "—" : totalWorkouts}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Workouts</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue} numberOfLines={1}>
                {loading ? "—" : formatDuration(totalDuration)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Time Trained</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue} numberOfLines={1}>
                {loading ? "—" : formatVolume(totalVolume)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Volume ({getUnit()})</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        {/* Active Program */}
        {activeProgram && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Active Program</ThemedText>
            <ThemedView style={styles.programCard}>
              <View style={styles.programHeader}>
                <View style={styles.programInfo}>
                  <ThemedText style={styles.programName}>
                    {activeProgram.program.name}
                  </ThemedText>
                  {activeProgram.program.description && (
                    <ThemedText style={styles.programDescription}>
                      {activeProgram.program.description}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.programNextDay}>
                    Next: Day {activeProgram.program.totalWorkoutsCompleted + 1} -{" "}
                    {activeProgram.nextDay.name}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.programActions}>
                <Pressable
                  style={styles.programActionButton}
                  onPress={() =>
                    router.push({
                      pathname: "/home/start-workout",
                      params: {
                        programId: activeProgram.program.id,
                        programDayId: activeProgram.nextDay.id,
                      },
                    })
                  }
                >
                  <IconSymbol size={20} name="play.fill" color="#007AFF" />
                  <ThemedText style={styles.programActionText}>
                    Start Next Day
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.programActionButton}
                  onPress={() =>
                    router.push({
                      pathname: "/programs/select-program-day",
                      params: { programId: activeProgram.program.id },
                    })
                  }
                >
                  <IconSymbol size={20} name="list.bullet" color="#007AFF" />
                  <ThemedText style={styles.programActionText}>
                    Choose Day
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </ThemedView>
        )}

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Quick Start</ThemedText>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/home/start-workout")}
          >
            <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Start Empty Workout
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/home/template-list")}
          >
            <IconSymbol size={24} name="list.bullet" color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Choose Template
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/programs/program-list")}
          >
            <IconSymbol size={24} name="calendar" color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Manage Programs
            </ThemedText>
          </Pressable>
        </ThemedView>
        {/* Recent Templates */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Templates</ThemedText>
          {loading ? (
            <ThemedText style={styles.emptyState}>Loading...</ThemedText>
          ) : recentTemplates.length === 0 ? (
            <ThemedText style={styles.emptyState}>
              No templates yet. Create your first workout template!
            </ThemedText>
          ) : (
            recentTemplates.map((template) => (
              <Pressable
                key={template.id}
                style={styles.templateCard}
                onPress={() =>
                  router.push(`/home/start-workout?templateId=${template.id}`)
                }
              >
                <View style={styles.templateInfo}>
                  <ThemedText style={styles.templateName}>
                    {template.name}
                  </ThemedText>
                  {template.description && (
                    <ThemedText style={styles.templateDescription}>
                      {template.description}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.templateMeta}>
                    {template.exercises.length}{" "}
                    {template.exercises.length === 1 ? "exercise" : "exercises"}
                  </ThemedText>
                </View>
                <IconSymbol size={20} name="chevron.right" color="#007AFF" />
              </Pressable>
            ))
          )}
        </ThemedView>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    height: 100,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 23,
    fontWeight: "bold",
    lineHeight: 28,
    textAlign: "center",
    width: "100%",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    padding: 20,
    textAlign: "center",
    opacity: 0.5,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    gap: 12,
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
  },
  templateDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  templateMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  programCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    gap: 12,
  },
  programHeader: {
    gap: 4,
  },
  programInfo: {
    gap: 4,
  },
  programName: {
    fontSize: 18,
    fontWeight: "700",
  },
  programDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  programNextDay: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
    marginTop: 4,
  },
  programActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  programActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    gap: 6,
  },
  programActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
