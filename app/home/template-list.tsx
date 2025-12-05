/**
 * Template List Screen
 *
 * Displays all workout templates with CRUD operations.
 * Features:
 * - List all templates
 * - Navigate to create/edit template
 * - Delete templates with confirmation
 * - Navigate to start workout from template
 */

import { Button } from "@/components/ui/button";
import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  fetchAllTemplates,
  removeTemplate,
} from "@/src/features/templates/api/templateService";
import { TemplateCard } from "@/src/features/templates/components/TemplateCard";
import { WorkoutTemplate } from "@/types";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TemplateListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await fetchAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      Alert.alert("Error", "Failed to load templates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTemplates();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleCreateNew = () => {
    router.push("/home/template-builder");
  };

  const handleEdit = (templateId: string) => {
    router.push({
      pathname: "/home/template-builder",
      params: { templateId },
    });
  };

  const handleDelete = (template: WorkoutTemplate) => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTemplate(template.id);
              await loadTemplates();
            } catch (error) {
              console.error("Error deleting template:", error);
              Alert.alert("Error", "Failed to delete template");
            }
          },
        },
      ]
    );
  };

  const handleTemplatePress = (template: WorkoutTemplate) => {
    router.push({
      pathname: "/home/start-workout",
      params: { templateId: template.id },
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              ←
            </Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Workout Templates
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {templates.length}{" "}
              {templates.length === 1 ? "template" : "templates"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        testID="template-list-scroll" // Added for testing
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
        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Templates Yet
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.textSecondary }]}
            >
              Create your first workout template to get started
            </Text>
            <Button
              title="Create Template"
              onPress={handleCreateNew}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPress={() => handleTemplatePress(template)}
                onEdit={() => handleEdit(template.id)}
                onDelete={() => handleDelete(template)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {templates.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Create New Template"
            onPress={handleCreateNew}
            fullWidth
          />
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  backButtonText: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.medium,
  },
  titleContainer: {
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: "center",
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
