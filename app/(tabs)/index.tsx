import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Workout Tracker</ThemedText>
          <ThemedText style={styles.subtitle}>Ready to train?</ThemedText>
        </ThemedView>

        {/* Quick Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>0</ThemedText>
            <ThemedText style={styles.statLabel}>Total Workouts</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>0</ThemedText>
            <ThemedText style={styles.statLabel}>This Week</ThemedText>
          </ThemedView>
        </ThemedView>

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
        </ThemedView>

        {/* Recent Templates */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Templates</ThemedText>
          <ThemedText style={styles.emptyState}>
            No templates yet. Create your first workout template!
          </ThemedText>
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
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
    textAlign: "center",
    width: "100%",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    gap: 12,
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
});
