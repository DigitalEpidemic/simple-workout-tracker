/**
 * Workout Detail Screen - Phase 4.1
 *
 * Features:
 * - Display completed workout (read-only)
 * - Show all exercises and sets
 * - Display workout notes
 * - Show PRs achieved
 * - Total volume and duration
 * - Option to delete workout
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { WorkoutSession, PRRecord } from '@/types';
import { getWorkoutById, deleteWorkout } from '@/src/features/history/api/historyService';
import { getPRsBySessionId } from '@/src/lib/db/repositories/pr-records';
import { getTotalVolumeBySessionId, countCompletedSetsBySessionId } from '@/src/lib/db/repositories/sets';
import { formatPRDescription } from '@/src/features/workouts/api/prService';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      // Load session
      const sessionData = await getWorkoutById(workoutId as string);
      if (!sessionData) {
        Alert.alert('Error', 'Workout not found');
        router.back();
        return;
      }

      setSession(sessionData);

      // Load stats
      const volume = await getTotalVolumeBySessionId(workoutId as string);
      setTotalVolume(volume);

      const sets = await countCompletedSetsBySessionId(workoutId as string);
      setTotalSets(sets);

      // Load PRs for this session
      const sessionPRs = await getPRsBySessionId(workoutId as string);
      setPRs(sessionPRs);
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteWorkout(workoutId as string);
              router.back();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout. Please try again.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Workout not found
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const exerciseCount = session.exercises.length;
  const duration = session.duration ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Workout Details</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date & Time */}
        <View style={styles.dateSection}>
          <Text style={[styles.date, { color: colors.text }]}>
            {formatDate(session.startTime)}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(session.startTime)}
          </Text>
        </View>

        {/* Workout Name */}
        <Text style={[styles.workoutName, { color: colors.text }]}>
          {session.name}
        </Text>

        {/* Template Name (if used) */}
        {session.templateName && session.templateName !== session.name && (
          <Text style={[styles.templateName, { color: colors.textSecondary }]}>
            from {session.templateName}
          </Text>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatDuration(duration)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {exerciseCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalSets}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {totalSets === 1 ? 'Set' : 'Sets'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalVolume.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Volume (lbs)
            </Text>
          </View>
        </View>

        {/* PRs Section */}
        {prs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={24} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Personal Records
              </Text>
            </View>
            <View style={styles.prList}>
              {prs.map((pr) => (
                <View
                  key={pr.id}
                  style={[
                    styles.prCard,
                    {
                      backgroundColor: colors.warningLight,
                      borderColor: colors.warning,
                    },
                  ]}
                >
                  <Ionicons name="trophy" size={20} color={colors.warning} />
                  <Text style={[styles.prText, { color: colors.text }]}>
                    {formatPRDescription(pr)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exercises Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
          <View style={styles.exerciseList}>
            {session.exercises.map((exercise, index) => {
              const completedSets = exercise.sets.filter((set) => set.completed).length;

              return (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseNumber, { color: colors.textTertiary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/history/exercise-history?exerciseName=${encodeURIComponent(
                            exercise.name
                          )}`
                        )
                      }
                      style={styles.historyButton}
                    >
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                  <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                    {completedSets} {completedSets === 1 ? 'set' : 'sets'} completed
                  </Text>
                  {exercise.sets.filter((set) => set.completed).map((set) => (
                    <Text
                      key={set.id}
                      style={[styles.setDetail, { color: colors.textTertiary }]}
                    >
                      {set.weight} lbs × {set.reps} {set.reps === 1 ? 'rep' : 'reps'}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        {/* Notes Section */}
        {session.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <View
              style={[
                styles.notesContainer,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.notesText, { color: colors.text }]}>
                {session.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Delete Button */}
        <View style={styles.deleteSection}>
          <Pressable
            onPress={handleDeleteWorkout}
            disabled={deleting}
            style={[
              styles.deleteButton,
              {
                borderColor: colors.error,
                opacity: deleting ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>
              {deleting ? 'Deleting...' : 'Delete Workout'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  backButtonText: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.medium,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  dateSection: {
    gap: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  time: {
    fontSize: FontSizes.base,
  },
  workoutName: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  templateName: {
    fontSize: FontSizes.base,
    fontStyle: 'italic',
    marginTop: -Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  prList: {
    gap: Spacing.sm,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  prText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    flex: 1,
  },
  exerciseList: {
    gap: Spacing.md,
  },
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  exerciseNumber: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  exerciseName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    flex: 1,
  },
  historyButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  exerciseStats: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  setDetail: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.lg,
  },
  notesContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  notesText: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  deleteSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  deleteButton: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: Spacing.md,
  },
});
