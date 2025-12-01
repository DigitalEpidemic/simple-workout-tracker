/**
 * Calendar Screen - Phase 4.2
 *
 * Features:
 * - Monthly calendar view
 * - Highlight days with workouts
 * - Tap on day to see workouts for that date
 * - Month navigation (previous/next)
 * - Navigate to workout detail from selected date
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Calendar } from '@/src/features/history/components/calendar';
import { WorkoutCard } from '@/src/features/history/components/workout-card';
import { getWorkoutsByMonth, CalendarDate } from '@/src/features/history/api/calendarService';
import { getWorkoutHistory, WorkoutSummary } from '@/src/features/history/api/historyService';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [workoutDates, setWorkoutDates] = useState<Map<string, CalendarDate>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load workouts for current month
   */
  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const dates = await getWorkoutsByMonth(currentYear, currentMonth);
      setWorkoutDates(dates);
    } catch (error) {
      console.error('Failed to load workouts for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reload workouts when screen is focused or month changes
   */
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [currentYear, currentMonth])
  );

  /**
   * Navigate to previous month
   */
  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(undefined);
    setSelectedWorkouts([]);
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(undefined);
    setSelectedWorkouts([]);
  };

  /**
   * Handle date selection
   */
  const handleDatePress = async (year: number, month: number, day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workoutData = workoutDates.get(dateKey);

    if (!workoutData || workoutData.workoutCount === 0) {
      // Clear selection if no workouts on this date
      setSelectedDate(undefined);
      setSelectedWorkouts([]);
      return;
    }

    setSelectedDate(dateKey);

    // Load full workout details for selected date
    try {
      const allWorkouts = await getWorkoutHistory();
      const dateWorkouts = allWorkouts.filter((workout) =>
        workoutData.workoutIds.includes(workout.id)
      );
      setSelectedWorkouts(dateWorkouts);
    } catch (error) {
      console.error('Failed to load workouts for date:', error);
      setSelectedWorkouts([]);
    }
  };

  /**
   * Navigate to workout detail screen
   */
  const handleWorkoutPress = (workoutId: string) => {
    router.push({
      pathname: '/history/workout-detail',
      params: { workoutId },
    });
  };

  /**
   * Format selected date for display
   */
  const getSelectedDateLabel = (): string => {
    if (!selectedDate) return '';

    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const monthName = MONTH_NAMES[date.getMonth()];

    return `${monthName} ${day}, ${year}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Month navigation */}
        <View style={styles.monthNavigation}>
          <Pressable
            onPress={handlePreviousMonth}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary },
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.monthLabel}>
            <ThemedText type="subtitle" style={styles.monthText}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </ThemedText>
          </View>

          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary },
            ]}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Calendar */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.calendarContainer}>
            <Calendar
              year={currentYear}
              month={currentMonth}
              workoutDates={workoutDates}
              selectedDate={selectedDate}
              onDatePress={handleDatePress}
            />
          </View>
        )}

        {/* Selected date workouts */}
        {selectedDate && selectedWorkouts.length > 0 && (
          <View style={styles.selectedDateSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {getSelectedDateLabel()}
            </ThemedText>
            <View style={styles.workoutList}>
              {selectedWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => handleWorkoutPress(workout.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty state when no date selected */}
        {!selectedDate && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Tap a highlighted date to view workouts
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    flexGrow: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  selectedDateSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  workoutList: {
    gap: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
