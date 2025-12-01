/**
 * Calendar Component - Monthly calendar view with workout indicators
 *
 * Features:
 * - Monthly calendar grid
 * - Highlights dates with workouts
 * - Shows workout count for each date
 * - Month navigation
 * - Tap to select date and view workouts
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarDate } from '../api/calendarService';

interface CalendarProps {
  year: number;
  month: number; // 0-11
  workoutDates: Map<string, CalendarDate>;
  selectedDate?: string; // YYYY-MM-DD
  onDatePress: (year: number, month: number, day: number) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get calendar grid data for a specific month
 *
 * Returns array of arrays representing weeks, with each cell containing
 * either a day number or null for empty cells.
 */
function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    week.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);

    // Start new week on Sunday (except for first week)
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // Add empty cells to complete last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    grid.push(week);
  }

  return grid;
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDateKey(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

export function Calendar({
  year,
  month,
  workoutDates,
  selectedDate,
  onDatePress,
}: CalendarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const grid = getCalendarGrid(year, month);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  /**
   * Render a single day cell
   */
  const renderDay = (day: number | null, weekIndex: number, dayIndex: number) => {
    if (day === null) {
      return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
    }

    const dateKey = formatDateKey(year, month, day);
    const workoutData = workoutDates.get(dateKey);
    const hasWorkouts = workoutData && workoutData.workoutCount > 0;
    const isSelected = selectedDate === dateKey;
    const isToday = day === todayDate;

    return (
      <Pressable
        key={`day-${day}`}
        style={styles.dayCell}
        onPress={() => onDatePress(year, month, day)}
      >
        <View
          style={[
            styles.dayContent,
            hasWorkouts && !isSelected && { backgroundColor: colors.primaryLight },
            isSelected && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            isToday &&
              !isSelected && {
                borderWidth: 2,
                borderColor: colors.primary,
              },
          ]}
        >
          <ThemedText
            style={[
              styles.dayText,
              { color: colors.text },
              isSelected && { color: colors.textInverse, fontWeight: '600' },
            ]}
          >
            {day}
          </ThemedText>
          {hasWorkouts && !isSelected && (
            <View
              style={[
                styles.workoutIndicator,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Days of week header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <ThemedText style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {grid.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.week}>
            {week.map((day, dayIndex) => renderDay(day, weekIndex, dayIndex))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    gap: Spacing.xs,
  },
  week: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
