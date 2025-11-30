/**
 * Theme system for the workout tracking application
 * Includes colors, typography, spacing, and design tokens
 */

import { Platform } from 'react-native';

// Base color palette
const tintColorLight = '#3B82F6'; // Blue-500
const tintColorDark = '#60A5FA'; // Blue-400

export const Colors = {
  light: {
    // Text colors
    text: '#1F2937', // Gray-800
    textSecondary: '#6B7280', // Gray-500
    textTertiary: '#9CA3AF', // Gray-400
    textInverse: '#FFFFFF',

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB', // Gray-50
    backgroundTertiary: '#F3F4F6', // Gray-100

    // Brand colors
    primary: tintColorLight,
    primaryLight: '#DBEAFE', // Blue-100
    primaryDark: '#1E40AF', // Blue-800

    // Semantic colors
    success: '#10B981', // Green-500
    successLight: '#D1FAE5', // Green-100
    error: '#EF4444', // Red-500
    errorLight: '#FEE2E2', // Red-100
    warning: '#F59E0B', // Amber-500
    warningLight: '#FEF3C7', // Amber-100
    info: '#3B82F6', // Blue-500
    infoLight: '#DBEAFE', // Blue-100

    // UI colors
    border: '#E5E7EB', // Gray-200
    borderFocus: tintColorLight,
    divider: '#E5E7EB', // Gray-200
    shadow: '#00000015',
    overlay: '#00000080',

    // Icon colors
    icon: '#6B7280', // Gray-500
    iconSecondary: '#9CA3AF', // Gray-400

    // Tab colors
    tabIconDefault: '#9CA3AF', // Gray-400
    tabIconSelected: tintColorLight,
    tabBackground: '#FFFFFF',
    tabBorder: '#E5E7EB', // Gray-200

    // Legacy (for compatibility)
    tint: tintColorLight,
  },
  dark: {
    // Text colors
    text: '#F9FAFB', // Gray-50
    textSecondary: '#9CA3AF', // Gray-400
    textTertiary: '#6B7280', // Gray-500
    textInverse: '#1F2937', // Gray-800

    // Background colors
    background: '#111827', // Gray-900
    backgroundSecondary: '#1F2937', // Gray-800
    backgroundTertiary: '#374151', // Gray-700

    // Brand colors
    primary: tintColorDark,
    primaryLight: '#1E3A8A', // Blue-900
    primaryDark: '#93C5FD', // Blue-300

    // Semantic colors
    success: '#34D399', // Green-400
    successLight: '#065F46', // Green-900
    error: '#F87171', // Red-400
    errorLight: '#7F1D1D', // Red-900
    warning: '#FBBF24', // Amber-400
    warningLight: '#78350F', // Amber-900
    info: '#60A5FA', // Blue-400
    infoLight: '#1E3A8A', // Blue-900

    // UI colors
    border: '#374151', // Gray-700
    borderFocus: tintColorDark,
    divider: '#374151', // Gray-700
    shadow: '#00000040',
    overlay: '#000000CC',

    // Icon colors
    icon: '#9CA3AF', // Gray-400
    iconSecondary: '#6B7280', // Gray-500

    // Tab colors
    tabIconDefault: '#6B7280', // Gray-500
    tabIconSelected: tintColorDark,
    tabBackground: '#1F2937', // Gray-800
    tabBorder: '#374151', // Gray-700

    // Legacy (for compatibility)
    tint: tintColorDark,
  },
};

// Typography system
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const FontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Spacing system (based on 4px grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows (elevation system)
export const Shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Component-specific design tokens
export const ComponentTokens = {
  button: {
    height: {
      sm: 32,
      md: 44,
      lg: 56,
    },
    paddingHorizontal: {
      sm: Spacing.md,
      md: Spacing.lg,
      lg: Spacing.xl,
    },
  },
  input: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    paddingHorizontal: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
};
