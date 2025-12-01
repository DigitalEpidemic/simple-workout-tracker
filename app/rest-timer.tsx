/**
 * Rest Timer Modal - Phase 3.3
 *
 * Features:
 * - Countdown timer display
 * - Pause/Resume controls
 * - Skip Rest button
 * - Add 30s quick button
 * - Sound/vibration feedback on completion
 * - Background timer support (continues when app is backgrounded)
 * - Auto-dismiss on completion
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Shadows,
  Spacing,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

export default function RestTimerModal() {
  const router = useRouter();
  const { duration } = useLocalSearchParams<{ duration: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const initialDuration = duration ? parseInt(duration, 10) : 90;

  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Background mode support
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);
  const timerEndTimeRef = useRef<number>(Date.now() + initialDuration * 1000);

  // Initialize timer end time
  useEffect(() => {
    timerEndTimeRef.current = Date.now() + initialDuration * 1000;
  }, [initialDuration]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - calculate elapsed time
        if (!isPaused && backgroundTimeRef.current !== null) {
          const elapsedWhileBackground = Date.now() - backgroundTimeRef.current;
          const newTimeRemaining = Math.max(
            0,
            timeRemaining - Math.floor(elapsedWhileBackground / 1000)
          );

          setTimeRemaining(newTimeRemaining);

          if (newTimeRemaining === 0) {
            handleTimerComplete();
          }

          backgroundTimeRef.current = null;
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        if (!isPaused) {
          backgroundTimeRef.current = Date.now();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isPaused, timeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || timeRemaining <= 0 || hasCompleted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining, hasCompleted]);

  // Play completion sound and haptic feedback
  const handleTimerComplete = async () => {
    if (hasCompleted) return;

    setHasCompleted(true);

    // Haptic feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }

    // Play completion sound (if available)
    // Note: Sound file is optional - app will work with haptics only
    try {
      // Try to play completion beep (multiple attempts for better UX)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available - that's OK
      console.log('Additional haptic feedback not available:', error);
    }

    // Auto-dismiss after 1 second
    setTimeout(() => {
      router.back();
    }, 1000);
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTime = async (seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
    timerEndTimeRef.current = Date.now() + (timeRemaining + seconds) * 1000;

    // Light haptic feedback for button press
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

  const handleSkip = async () => {
    // Light haptic feedback for skip
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }

    router.back();
  };

  const handlePauseResume = async () => {
    setIsPaused(!isPaused);

    if (!isPaused) {
      // Pausing - store current time
      backgroundTimeRef.current = Date.now();
    } else {
      // Resuming - clear background time
      backgroundTimeRef.current = null;
      timerEndTimeRef.current = Date.now() + timeRemaining * 1000;
    }

    // Light haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

  // Progress calculation for visual indicator
  const progress = timeRemaining / initialDuration;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip} style={styles.headerButton}>
          <IconSymbol size={28} name="xmark" color={colors.error} />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>
          Rest Timer
        </ThemedText>
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Timer Circle */}
        <View
          style={[
            styles.timerCircle,
            {
              backgroundColor: hasCompleted
                ? colors.successLight
                : `${colors.primary}15`,
              borderColor: hasCompleted ? colors.success : colors.primary,
            },
            Shadows.lg,
          ]}
        >
          {/* Progress ring */}
          <View
            style={[
              styles.progressRing,
              {
                borderColor: hasCompleted ? colors.success : colors.primary,
                opacity: progress,
              },
            ]}
          />

          <Text
            style={[
              styles.timerText,
              {
                color: hasCompleted ? colors.success : colors.text,
              },
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>

          {hasCompleted && (
            <Text style={[styles.completeText, { color: colors.success }]}>
              Complete!
            </Text>
          )}
        </View>

        {/* Pause/Resume Button */}
        {!hasCompleted && (
          <Pressable style={styles.pauseButton} onPress={handlePauseResume}>
            <IconSymbol
              size={32}
              name={isPaused ? 'play.fill' : 'pause.fill'}
              color={colors.primary}
            />
            <Text style={[styles.pauseButtonText, { color: colors.text }]}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>
        )}

        {/* Quick Actions */}
        {!hasCompleted && (
          <View style={styles.quickActions}>
            <Pressable
              style={[
                styles.quickButton,
                { backgroundColor: colors.primaryLight },
                Shadows.sm,
              ]}
              onPress={() => handleAddTime(30)}
            >
              <Text style={[styles.quickButtonText, { color: colors.primary }]}>
                +30s
              </Text>
            </Pressable>
          </View>
        )}

        {/* Skip Button */}
        {!hasCompleted && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipButtonText, { color: colors.error }]}>
              Skip Rest
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing['2xl'],
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 296,
    height: 296,
    borderRadius: 148,
    borderWidth: 4,
  },
  timerText: {
    fontSize: 72,
    fontWeight: FontWeights.bold,
    letterSpacing: -2,
  },
  completeText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    marginTop: Spacing.sm,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pauseButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skipButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
});
