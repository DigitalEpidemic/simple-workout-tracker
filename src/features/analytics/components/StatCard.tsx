/**
 * StatCard Component
 *
 * Displays a single statistic with a label and value.
 * Used in the analytics dashboard for quick stats overview.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    overflow: 'hidden',
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
});
