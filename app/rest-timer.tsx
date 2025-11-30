import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Rest Timer Modal - Countdown rest timer
 *
 * Features:
 * - Display countdown timer
 * - Show remaining time prominently
 * - Pause/Resume controls
 * - Skip Rest button
 * - Add 15s / Add 30s quick buttons
 * - Haptic feedback on completion
 * - Auto-dismiss on completion
 */
export default function RestTimerModal() {
  const router = useRouter();
  const { duration } = useLocalSearchParams<{ duration: string }>();

  const [timeRemaining, setTimeRemaining] = React.useState(
    duration ? parseInt(duration, 10) : 90
  );
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer complete - auto-dismiss
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTime = (seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Pressable onPress={handleSkip}>
          <IconSymbol size={28} name="xmark" color="#FF3B30" />
        </Pressable>
        <ThemedText type="title">Rest Timer</ThemedText>
        <ThemedView style={{ width: 28 }} />
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.timerCircle}>
          <ThemedText style={styles.timerText}>{formatTime(timeRemaining)}</ThemedText>
        </ThemedView>

        <Pressable
          style={styles.pauseButton}
          onPress={() => setIsPaused(!isPaused)}
        >
          <IconSymbol
            size={32}
            name={isPaused ? 'play.fill' : 'pause.fill'}
            color="#007AFF"
          />
          <ThemedText style={styles.pauseButtonText}>
            {isPaused ? 'Resume' : 'Pause'}
          </ThemedText>
        </Pressable>

        <ThemedView style={styles.quickActions}>
          <Pressable
            style={styles.quickButton}
            onPress={() => handleAddTime(15)}
          >
            <ThemedText style={styles.quickButtonText}>+15s</ThemedText>
          </Pressable>
          <Pressable
            style={styles.quickButton}
            onPress={() => handleAddTime(30)}
          >
            <ThemedText style={styles.quickButtonText}>+30s</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <ThemedText style={styles.skipButtonText}>Skip Rest</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
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
    padding: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 32,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#007AFF',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  pauseButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  skipButton: {
    padding: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
