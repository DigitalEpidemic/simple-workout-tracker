/**
 * Settings Store
 *
 * Global state management for user settings and preferences.
 * Uses React Context for state sharing across the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings } from '@/types';
import { getSettings, updateSettings } from '@/src/lib/db/repositories/settings';

/**
 * Settings context type
 */
interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateWeightUnit: (unit: 'kg' | 'lbs') => Promise<void>;
  updateDefaultRestTime: (seconds: number) => Promise<void>;
  updateHapticsEnabled: (enabled: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

/**
 * Settings context
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Settings Provider Component
 *
 * Wraps the app and provides settings state to all children.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load settings from database
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial settings load
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Update weight unit preference
   */
  const updateWeightUnit = async (unit: 'kg' | 'lbs') => {
    try {
      const updated = await updateSettings({ weightUnit: unit });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update weight unit:', error);
      throw error;
    }
  };

  /**
   * Update default rest time
   */
  const updateDefaultRestTime = async (seconds: number) => {
    try {
      const updated = await updateSettings({ defaultRestTime: seconds });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update default rest time:', error);
      throw error;
    }
  };

  /**
   * Update haptics preference
   */
  const updateHapticsEnabled = async (enabled: boolean) => {
    try {
      const updated = await updateSettings({ enableHaptics: enabled });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update haptics setting:', error);
      throw error;
    }
  };

  /**
   * Refresh settings from database
   */
  const refreshSettings = async () => {
    await loadSettings();
  };

  const value: SettingsContextType = {
    settings,
    isLoading,
    updateWeightUnit,
    updateDefaultRestTime,
    updateHapticsEnabled,
    refreshSettings,
  };

  return React.createElement(
    SettingsContext.Provider,
    { value },
    children
  );
}

/**
 * Hook to access settings context
 *
 * @throws Error if used outside of SettingsProvider
 * @returns SettingsContextType
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

/**
 * Hook to get current weight unit
 *
 * @returns 'kg' | 'lbs' | null (null while loading)
 */
export function useWeightUnit(): 'kg' | 'lbs' | null {
  const { settings } = useSettings();
  return settings?.weightUnit ?? null;
}

/**
 * Hook to get default rest time in seconds
 *
 * @returns number | null (null while loading)
 */
export function useDefaultRestTime(): number | null {
  const { settings } = useSettings();
  return settings?.defaultRestTime ?? null;
}

/**
 * Hook to check if haptics are enabled
 *
 * @returns boolean
 */
export function useHapticsEnabled(): boolean {
  const { settings } = useSettings();
  return settings?.enableHaptics ?? true;
}
