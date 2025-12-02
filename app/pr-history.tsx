/**
 * PR History Screen
 *
 * Displays a comprehensive list of all personal records grouped by exercise.
 * Shows PR details including rep count, weight, and date achieved.
 * Accessible from the Analytics screen.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { PRHistoryList } from '@/src/features/analytics/components/PRHistoryList';

export default function PRHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Personal Records</Text>
        </View>
      </View>

      {/* Content */}
      <PRHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
});
