import { Colors, ComponentTokens, Shadows, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

export type CardVariant = "elevated" | "outlined" | "filled";

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: keyof typeof Spacing;
  children?: React.ReactNode;
}

export function Card({
  variant = "elevated",
  padding = "md",
  children,
  style,
  ...props
}: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    switch (variant) {
      case "filled":
        return colors.backgroundSecondary;
      case "elevated":
      case "outlined":
      default:
        return colors.background;
    }
  };

  const getBorderColor = () => {
    if (variant === "outlined") {
      return colors.border;
    }
    return "transparent";
  };

  const getShadow = () => {
    if (variant === "elevated") {
      return Shadows.md;
    }
    return Shadows.none;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outlined" ? 1 : 0,
          borderRadius: ComponentTokens.card.borderRadius,
          padding: Spacing[padding],
        },
        getShadow(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
