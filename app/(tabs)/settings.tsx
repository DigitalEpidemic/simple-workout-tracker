import React from 'react';
import { StyleSheet, ScrollView, View, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Settings Screen - App preferences
 *
 * Features:
 * - Weight unit (lbs/kg)
 * - Default rest timer duration
 * - Theme (light/dark/auto)
 * - Haptic feedback toggle
 * - Data management (export, import, clear)
 * - About section
 */
export default function SettingsScreen() {
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);

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

          <ThemedView style={styles.settingRow}>
            <ThemedView style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Weight Unit</ThemedText>
              <ThemedText style={styles.settingDescription}>Currently: lbs</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.settingRow}>
            <ThemedView style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Default Rest Time</ThemedText>
              <ThemedText style={styles.settingDescription}>Currently: 90 seconds</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* App Preferences */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">App Preferences</ThemedText>

          <ThemedView style={styles.settingRow}>
            <ThemedView style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Haptic Feedback</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Vibrate on button presses
              </ThemedText>
            </ThemedView>
            <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
          </ThemedView>
        </ThemedView>

        {/* About */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <ThemedText style={styles.settingDescription}>
            Version 1.0.0
          </ThemedText>
        </ThemedView>
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
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
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
});
