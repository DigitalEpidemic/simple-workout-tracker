import { Stack } from 'expo-router';

/**
 * Home Stack Layout - Configures navigation for home stack screens
 */
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="template-list" />
      <Stack.Screen name="template-builder" />
      <Stack.Screen name="start-workout" />
      <Stack.Screen name="active-workout" />
      <Stack.Screen name="exercise-detail" />
      <Stack.Screen name="workout-summary" />
    </Stack>
  );
}
