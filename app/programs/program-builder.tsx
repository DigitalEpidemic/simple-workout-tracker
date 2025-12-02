/**
 * Program Builder Screen
 *
 * Create or edit multi-day training programs.
 * Features:
 * - Create/Edit program with name and description
 * - Add/remove/reorder program days
 * - Navigate to day editor for each day
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchProgramById,
  createNewProgram,
  updateExistingProgram,
  addProgramDay,
  removeProgramDay,
} from '@/src/features/programs/api/programService';
import { ProgramDayCard } from '@/src/features/programs/components/ProgramDayCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProgramDay } from '@/types';

export default function ProgramBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isEditing = !!id;

  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadProgram(id);
    }
  }, [id]);

  // Reload program data when screen comes into focus (e.g., after editing a day)
  useFocusEffect(
    React.useCallback(() => {
      // Reload if we have a program ID (either from editing or newly created)
      const idToLoad = isEditing ? id : programId;
      if (idToLoad) {
        loadProgram(idToLoad);
      }
    }, [isEditing, id, programId])
  );

  const loadProgram = async (programId: string) => {
    try {
      const program = await fetchProgramById(programId);
      if (program) {
        setProgramId(program.id);
        setProgramName(program.name);
        setProgramDescription(program.description || '');
        setDays(program.days);
      }
    } catch (error) {
      console.error('Error loading program:', error);
      Alert.alert('Error', 'Failed to load program');
    }
  };

  const handleAddDay = async () => {
    let currentProgramId = programId;

    if (!currentProgramId) {
      // If program doesn't exist yet, save it first
      const savedId = await handleSaveProgram(true);
      if (!savedId) return;
      currentProgramId = savedId;
    }

    Alert.prompt(
      'Add Program Day',
      'Enter day name (e.g., "Upper Body", "Lower Body")',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (text?: string) => {
            if (!text || text.trim().length === 0) {
              Alert.alert('Error', 'Day name cannot be empty');
              return;
            }

            try {
              const newDay = await addProgramDay(currentProgramId!, text.trim());
              setDays([...days, newDay]);
            } catch (error) {
              console.error('Error adding day:', error);
              Alert.alert('Error', 'Failed to add day');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteDay = (dayId: string, dayName: string) => {
    Alert.alert(
      'Delete Day',
      `Delete "${dayName}"? This will also delete all exercises for this day.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!programId) return;

            try {
              await removeProgramDay(programId, dayId);
              setDays(days.filter((d) => d.id !== dayId));
            } catch (error) {
              console.error('Error deleting day:', error);
              Alert.alert('Error', 'Failed to delete day');
            }
          },
        },
      ]
    );
  };

  const handleEditDay = (dayId: string) => {
    router.push(`/programs/program-day-editor?dayId=${dayId}&programId=${programId}`);
  };

  const handleSaveProgram = async (silent: boolean = false): Promise<string | null> => {
    if (programName.trim().length === 0) {
      Alert.alert('Invalid Name', 'Program name cannot be empty');
      return null;
    }

    try {
      setSaving(true);

      if (isEditing && programId) {
        await updateExistingProgram(programId, programName.trim(), programDescription.trim());
        if (!silent) {
          Alert.alert('Success', 'Program updated');
          router.back();
        }
        return programId;
      } else {
        const newProgram = await createNewProgram(programName.trim(), programDescription.trim());
        setProgramId(newProgram.id);
        if (!silent) {
          Alert.alert('Success', 'Program created');
          router.back();
        }
        return newProgram.id;
      }
    } catch (error) {
      console.error('Error saving program:', error);
      Alert.alert('Error', 'Failed to save program');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Program Name & Description */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Program Details</ThemedText>

              <Input
                label="Program Name"
                placeholder="e.g., Upper/Lower Split"
                value={programName}
                onChangeText={setProgramName}
                autoCapitalize="words"
              />

              <Input
                label="Description (optional)"
                placeholder="e.g., 4-day split focusing on strength"
                value={programDescription}
                onChangeText={setProgramDescription}
                autoCapitalize="sentences"
                multiline
              />
            </View>

            {/* Program Days */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Program Days</ThemedText>
                <Pressable onPress={handleAddDay}>
                  <ThemedText style={[styles.addButton, { color: colors.tint }]}>
                    + Add Day
                  </ThemedText>
                </Pressable>
              </View>

              {days.length === 0 ? (
                <ThemedText style={styles.emptyText}>
                  No days yet. Add your first program day to get started.
                </ThemedText>
              ) : (
                days.map((day) => (
                  <ProgramDayCard
                    key={day.id}
                    day={day}
                    isNextDay={false}
                    onPress={() => handleEditDay(day.id)}
                    onDelete={() => handleDeleteDay(day.id, day.name)}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button
            title={isEditing ? 'Update Program' : 'Create Program'}
            onPress={() => handleSaveProgram(false)}
            loading={saving}
            disabled={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  addButton: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
