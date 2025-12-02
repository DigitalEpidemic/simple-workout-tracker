/**
 * Programs Stack Navigator
 *
 * PLACEHOLDER: Basic navigation structure for program screens
 */

import { Stack } from 'expo-router';

export default function ProgramsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="program-list"
        options={{
          title: 'Programs',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="program-builder"
        options={{
          title: 'Edit Program',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="program-day-editor"
        options={{
          title: 'Edit Day',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="select-program-day"
        options={{
          title: 'Select Day',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
