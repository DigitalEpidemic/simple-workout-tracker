import { Stack } from 'expo-router';

/**
 * History Stack Layout - Configures navigation for history stack screens
 */
export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="workout-detail" />
    </Stack>
  );
}
