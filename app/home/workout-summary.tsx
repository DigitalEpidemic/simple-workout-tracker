/**
 * Workout Summary Screen - Phase 3.4
 *
 * Features:
 * - Display completed workout details
 * - Total duration (calculated from endTime - startTime)
 * - Exercises completed, total sets, total volume
 * - PRs achieved (highlighted)
 * - Option to add workout notes
 * - Save or Discard workout
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { WorkoutSession, PRRecord } from '@/types';
import { getSessionById, deleteSession, updateSession } from '@/src/lib/db/repositories/sessions';
import { getTotalVolumeBySessionId, countCompletedSetsBySessionId } from '@/src/lib/db/repositories/sets';
import { detectAndSavePRs, formatPRDescription } from '@/src/features/workouts/api/prService';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { workoutSessionId } = useLocalSearchParams<{ workoutSessionId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutSessionId]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      // Load session
      const sessionData = await getSessionById(workoutSessionId as string, true);
      if (!sessionData) {
        Alert.alert('Error', 'Workout session not found');
        router.back();
        return;
      }

      setSession(sessionData);
      setNotes(sessionData.notes ?? '');

      // Load stats
      const volume = await getTotalVolumeBySessionId(workoutSessionId as string);
      setTotalVolume(volume);

      const sets = await countCompletedSetsBySessionId(workoutSessionId as string);
      setTotalSets(sets);

      // Detect and save PRs
      const detectedPRs = await detectAndSavePRs(workoutSessionId as string);
      setPRs(detectedPRs);
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveWorkout = async () => {
    if (!session) return;

    try {
      setSaving(true);

      // Update notes if changed
      if (notes !== (session.notes ?? '')) {
        await updateSession(session.id, {
          notes: notes.trim() || null,
          updatedAt: Date.now(),
        });
      }

      Alert.alert(
        'Workout Saved!',
        prs.length > 0
          ? `Great job! You achieved ${prs.length} new ${prs.length === 1 ? 'PR' : 'PRs'}!`
          : 'Your workout has been saved.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout notes. Please try again.');
      setSaving(false);
    }
  };

  const handleDiscardWorkout = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard this workout? All data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteSession(workoutSessionId as string);
              router.push('/(tabs)');
            } catch (error) {
              console.error('Error discarding workout:', error);
              Alert.alert('Error', 'Failed to discard workout. Please try again.');
              setSaving(false);
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Workout Complete!</Text>
          <Text style={[styles.workoutName, { color: colors.textSecondary }]}>
            {session.name}
          </Text>
        </View>

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
                New Personal Records!
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this workout..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            style={[
              styles.notesInput,
              {
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          title="Discard"
          onPress={handleDiscardWorkout}
          variant="outline"
          disabled={saving}
          style={styles.discardButton}
        />
        <Button
          title={saving ? 'Saving...' : 'Save Workout'}
          onPress={handleSaveWorkout}
          disabled={saving}
          style={styles.saveButton}
        />
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  workoutName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
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
  exerciseStats: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  setDetail: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  discardButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
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
