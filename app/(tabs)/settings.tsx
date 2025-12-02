/**
 * Settings Screen - Phase 4.6
 *
 * User preferences and app settings:
 * - Weight unit (lbs/kg)
 * - Default rest timer duration
 * - Haptic feedback toggle
 * - Reset all data (with confirmation)
 */

import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Switch, Pressable, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/src/stores/settingsStore';
import { deleteAllData } from '@/src/lib/db/repositories/settings';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const {
    settings,
    isLoading,
    updateWeightUnit,
    updateDefaultRestTime,
    updateHapticsEnabled,
    refreshSettings,
  } = useSettings();

  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handle weight unit toggle
   */
  const handleWeightUnitToggle = async () => {
    if (!settings) return;

    const newUnit = settings.weightUnit === 'lbs' ? 'kg' : 'lbs';
    try {
      await updateWeightUnit(newUnit);
    } catch (error) {
      Alert.alert('Error', 'Failed to update weight unit');
    }
  };

  /**
   * Handle rest time change
   */
  const handleRestTimeChange = () => {
    Alert.prompt(
      'Default Rest Time',
      'Enter rest time in seconds:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const newValue = parseInt(value || '90', 10);
            if (isNaN(newValue) || newValue < 0 || newValue > 600) {
              Alert.alert('Invalid Input', 'Please enter a value between 0 and 600 seconds.');
              return;
            }
            try {
              await updateDefaultRestTime(newValue);
            } catch (error) {
              Alert.alert('Error', 'Failed to update rest time');
            }
          },
        },
      ],
      'plain-text',
      settings?.defaultRestTime.toString()
    );
  };

  /**
   * Handle haptics toggle
   */
  const handleHapticsToggle = async (enabled: boolean) => {
    try {
      await updateHapticsEnabled(enabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update haptics setting');
    }
  };

  /**
   * Handle reset all data
   */
  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all workout data? This action cannot be undone.\n\nThis will delete:\n• All workout sessions\n• All templates\n• All PR records\n• All exercise history',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAllData();
              await refreshSettings();
              Alert.alert('Success', 'All data has been deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data');
              console.error('Delete all data error:', error);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Render rest time options
   */
  const renderRestTimeOption = (seconds: number, label: string) => {
    const isSelected = settings?.defaultRestTime === seconds;

    return (
      <Pressable
        key={seconds}
        style={[
          styles.restTimeOption,
          {
            backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          Shadows.sm,
        ]}
        onPress={() => updateDefaultRestTime(seconds)}
      >
        <ThemedText
          style={[
            styles.restTimeLabel,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading settings...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
          <ThemedText style={styles.subtitle}>Customize your experience</ThemedText>
        </ThemedView>

        {/* Workout Preferences */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Workout Preferences</ThemedText>

          {/* Weight Unit */}
          <ThemedView
            style={[
              styles.settingRow,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Weight Unit</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Display weights in pounds or kilograms
              </ThemedText>
            </View>
            <Pressable
              style={[
                styles.unitToggle,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={handleWeightUnitToggle}
            >
              <View
                style={[
                  styles.unitOption,
                  settings?.weightUnit === 'lbs' && [
                    styles.unitOptionActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <ThemedText
                  style={[
                    styles.unitText,
                    {
                      color: settings?.weightUnit === 'lbs' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  lbs
                </ThemedText>
              </View>
              <View
                style={[
                  styles.unitOption,
                  settings?.weightUnit === 'kg' && [
                    styles.unitOptionActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <ThemedText
                  style={[
                    styles.unitText,
                    {
                      color: settings?.weightUnit === 'kg' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  kg
                </ThemedText>
              </View>
            </Pressable>
          </ThemedView>

          {/* Default Rest Time */}
          <ThemedView
            style={[
              styles.settingColumn,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Default Rest Time</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Choose your preferred rest duration
              </ThemedText>
            </View>
            <View style={styles.restTimeGrid}>
              {renderRestTimeOption(30, '30s')}
              {renderRestTimeOption(60, '1:00')}
              {renderRestTimeOption(90, '1:30')}
              {renderRestTimeOption(120, '2:00')}
              {renderRestTimeOption(180, '3:00')}
              {renderRestTimeOption(240, '4:00')}
            </View>
            <Pressable
              style={[styles.customButton, { borderColor: colors.border }]}
              onPress={handleRestTimeChange}
            >
              <IconSymbol size={20} name="pencil" color={colors.primary} />
              <ThemedText style={{ color: colors.primary }}>Custom</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {/* App Preferences */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">App Preferences</ThemedText>

          {/* Haptic Feedback */}
          <ThemedView
            style={[
              styles.settingRow,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Haptic Feedback</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Vibrate on button presses and timer completion
              </ThemedText>
            </View>
            <Switch
              value={settings?.enableHaptics ?? true}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </ThemedView>
        </ThemedView>

        {/* Data Management */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Data Management</ThemedText>

          {/* Reset All Data */}
          <Pressable
            style={[
              styles.dangerButton,
              { backgroundColor: colors.errorLight, borderColor: colors.error },
              Shadows.sm,
            ]}
            onPress={handleResetAllData}
            disabled={isDeleting}
          >
            <IconSymbol size={24} name="trash" color={colors.error} />
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingLabel, { color: colors.error }]}>
                {isDeleting ? 'Deleting...' : 'Reset All Data'}
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.error }]}>
                Delete all workouts, templates, and records
              </ThemedText>
            </View>
          </Pressable>
        </ThemedView>

        {/* About */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <ThemedView
            style={[
              styles.settingRow,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Version</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                1.0.0
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
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
    padding: Spacing.lg,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  settingColumn: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  unitOptionActive: {
    // backgroundColor set dynamically
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  restTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  restTimeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  restTimeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
});
