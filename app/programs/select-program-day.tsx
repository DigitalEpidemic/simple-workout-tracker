/**
 * Select Program Day Screen
 *
 * Choose which program day to perform (manual day selection).
 * Features:
 * - Display all days in the active program
 * - Highlight the "Next Day" (based on current_day_index)
 * - Allow selecting any day
 * - Navigate to start-workout with program context
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchProgramById } from '@/src/features/programs/api/programService';
import { ProgramDayCard } from '@/src/features/programs/components/ProgramDayCard';
import { Button } from '@/components/ui/button';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Program, ProgramDay } from '@/types';

export default function SelectProgramDayScreen() {
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [program, setProgram] = useState<Program | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (programId) {
      loadProgram(programId);
    }
  }, [programId]);

  const loadProgram = async (id: string) => {
    try {
      const data = await fetchProgramById(id);
      if (data) {
        setProgram(data);
        // Pre-select the next day based on current_day_index
        if (data.days.length > 0) {
          const nextDay = data.days[data.currentDayIndex];
          if (nextDay) {
            setSelectedDayId(nextDay.id);
          }
        }
      } else {
        Alert.alert('Error', 'Program not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading program:', error);
      Alert.alert('Error', 'Failed to load program');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (dayId: string) => {
    setSelectedDayId(dayId);
  };

  const handleStartWorkout = () => {
    if (!selectedDayId || !programId) {
      Alert.alert('Error', 'Please select a day');
      return;
    }

    router.push({
      pathname: '/home/start-workout',
      params: {
        programId,
        programDayId: selectedDayId,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Program not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Select Program Day</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {program.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {program.days.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Days in Program</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              This program has no days. Add days to the program first.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Select which day you want to perform:
            </Text>

            {program.days.map((day: ProgramDay) => {
              const isNextDay = day.dayIndex === program.currentDayIndex;
              const isSelected = day.id === selectedDayId;

              return (
                <Pressable
                  key={day.id}
                  onPress={() => handleDayPress(day.id)}
                  style={[
                    styles.dayCardWrapper,
                    isSelected && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <ProgramDayCard
                    day={day}
                    isNextDay={isNextDay}
                    onPress={() => handleDayPress(day.id)}
                  />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {program.days.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            disabled={!selectedDayId}
            fullWidth
          />
        </View>
      )}
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
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  instruction: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.md,
  },
  dayCardWrapper: {
    marginBottom: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.lg,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
