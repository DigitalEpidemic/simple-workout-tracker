/**
 * ExerciseSelector Component
 *
 * A modern, searchable exercise selector with:
 * - Search/filter functionality
 * - Clean, minimal design
 * - Clear visual feedback
 * - Optimized for large lists
 */

import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";

interface ExerciseSelectorProps {
  exercises: string[];
  selectedExercise: string;
  onSelectExercise: (exercise: string) => void;
}

export function ExerciseSelector({
  exercises,
  selectedExercise,
  onSelectExercise,
}: ExerciseSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exercises;
    }
    const query = searchQuery.toLowerCase();
    return exercises.filter((exercise) =>
      exercise.toLowerCase().includes(query)
    );
  }, [exercises, searchQuery]);

  const handleSelectExercise = (exercise: string) => {
    onSelectExercise(exercise);
    setIsExpanded(false);
    setSearchQuery("");
  };

  return (
    <ThemedView style={styles.container}>
      {/* Selected Exercise Button */}
      <TouchableOpacity
        style={[
          styles.selectedButton,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedContent}>
          <View style={styles.selectedTextContainer}>
            <ThemedText style={styles.selectedLabel}>Exercise</ThemedText>
            <ThemedText style={styles.selectedExercise}>
              {selectedExercise || "Select an exercise"}
            </ThemedText>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.text}
          />
        </View>
      </TouchableOpacity>

      {/* Dropdown List */}
      {isExpanded && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Search Input */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredExercises.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No exercises found
                </ThemedText>
              </View>
            ) : (
              filteredExercises.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.exerciseItem,
                    item === selectedExercise && {
                      backgroundColor: colors.tint + "15",
                    },
                  ]}
                  onPress={() => handleSelectExercise(item)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.exerciseText,
                      item === selectedExercise && {
                        color: colors.tint,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {item}
                  </ThemedText>
                  {item === selectedExercise && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Results count */}
          {searchQuery.length > 0 && (
            <View
              style={[
                styles.footer,
                { borderTopColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <ThemedText style={styles.footerText}>
                {filteredExercises.length} result
                {filteredExercises.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  selectedButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  selectedExercise: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropdown: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 400,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingVertical: Spacing.xs,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  exerciseText: {
    fontSize: 15,
    flex: 1,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
});
