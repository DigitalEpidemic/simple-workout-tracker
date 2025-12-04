import {
  BorderRadius,
  Colors,
  ComponentTokens,
  FontSizes,
  FontWeights,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: TouchableOpacityProps["style"];
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) {
      return colors.backgroundTertiary;
    }

    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.backgroundTertiary;
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      case "danger":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) {
      return colors.textTertiary;
    }

    switch (variant) {
      case "primary":
        return colors.textInverse;
      case "secondary":
        return colors.text;
      case "outline":
        return colors.primary;
      case "ghost":
        return colors.primary;
      case "danger":
        return colors.textInverse;
      default:
        return colors.textInverse;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return isDisabled ? colors.border : colors.primary;
    }
    return "transparent";
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height: ComponentTokens.button.height[size],
          paddingHorizontal: ComponentTokens.button.paddingHorizontal[size],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          borderRadius: BorderRadius.md,
          opacity: isDisabled ? 0.6 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize:
                size === "sm"
                  ? FontSizes.sm
                  : size === "lg"
                  ? FontSizes.lg
                  : FontSizes.base,
              fontWeight: FontWeights.semibold,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    textAlign: "center",
  },
});
