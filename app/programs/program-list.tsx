/**
 * Program List Screen
 *
 * Displays all multi-day training programs with CRUD operations.
 * Features:
 * - List all programs
 * - Navigate to create/edit program
 * - Activate programs (only one can be active)
 * - Delete programs with confirmation
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Program } from '@/types';
import {
  fetchAllPrograms,
  removeProgram,
  activateProgram,
  fetchProgramById,
} from '@/src/features/programs/api/programService';
import { ProgramCard } from '@/src/features/programs/components/ProgramCard';
import { Button } from '@/components/ui/button';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProgramListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [programs, setPrograms] = useState<Omit<Program, 'days'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPrograms = async () => {
    try {
      const data = await fetchAllPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPrograms();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadPrograms();
  };

  const handleCreateNew = () => {
    router.push('/programs/program-builder');
  };

  const handleEdit = (programId: string) => {
    router.push({
      pathname: '/programs/program-builder',
      params: { programId },
    });
  };

  const handleActivate = async (programId: string) => {
    try {
      // Check if program has days before activating
      const program = await fetchProgramById(programId);
      if (!program || program.days.length === 0) {
        Alert.alert(
          'Cannot Activate',
          'This program has no days. Add at least one day before activating.'
        );
        return;
      }

      await activateProgram(programId);
      await loadPrograms();
      Alert.alert('Success', 'Program activated');
    } catch (error) {
      console.error('Error activating program:', error);
      Alert.alert('Error', 'Failed to activate program');
    }
  };

  const handleDelete = (program: Omit<Program, 'days'>) => {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${program.name}"? This will delete all days and exercises. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProgram(program.id);
              await loadPrograms();
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Training Programs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {programs.length} {programs.length === 1 ? 'program' : 'programs'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {programs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Programs Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Create your first multi-day training program to get started
            </Text>
            <Button
              title="Create Program"
              onPress={handleCreateNew}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onPress={() => handleEdit(program.id)}
                onActivate={() => handleActivate(program.id)}
                onDelete={() => handleDelete(program)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {programs.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button title="Create New Program" onPress={handleCreateNew} fullWidth />
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
  emptyButton: {
    minWidth: 200,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
