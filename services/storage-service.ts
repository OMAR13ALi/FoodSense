/**
 * Storage Service - AsyncStorage persistence
 * Handles saving and loading app data to/from local storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, UserSettings } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  MEALS_PREFIX: 'meals_', // meals_YYYY-MM-DD
  USER_SETTINGS: 'user_settings',
  LAST_SYNC: 'last_sync_date',
} as const;

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get storage key for meals on a specific date
 */
function getMealsKey(date: Date): string {
  return `${STORAGE_KEYS.MEALS_PREFIX}${formatDateKey(date)}`;
}

/**
 * Save meals for a specific date
 */
export async function saveMeals(meals: MealEntry[], date: Date = new Date()): Promise<void> {
  try {
    const key = getMealsKey(date);

    // Convert Date objects to ISO strings for JSON serialization
    const serializedMeals = meals.map(meal => ({
      ...meal,
      timestamp: meal.timestamp.toISOString(),
    }));

    await AsyncStorage.setItem(key, JSON.stringify(serializedMeals));

    // Update last sync date
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving meals:', error);
    throw new Error('Failed to save meals to storage');
  }
}

/**
 * Load meals for a specific date
 */
export async function loadMeals(date: Date = new Date()): Promise<MealEntry[]> {
  try {
    const key = getMealsKey(date);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    // Convert ISO strings back to Date objects
    return parsed.map((meal: any) => ({
      ...meal,
      timestamp: new Date(meal.timestamp),
    }));
  } catch (error) {
    console.error('Error loading meals:', error);
    return [];
  }
}

/**
 * Delete meals for a specific date
 */
export async function deleteMeals(date: Date = new Date()): Promise<void> {
  try {
    const key = getMealsKey(date);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting meals:', error);
    throw new Error('Failed to delete meals from storage');
  }
}

/**
 * Get all dates that have stored meals
 */
export async function getAllMealDates(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mealKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.MEALS_PREFIX));

    return mealKeys
      .map(key => key.replace(STORAGE_KEYS.MEALS_PREFIX, ''))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error getting meal dates:', error);
    return [];
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings to storage');
  }
}

/**
 * Load user settings
 */
export async function loadSettings(): Promise<UserSettings | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
}

/**
 * Clear all app data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw new Error('Failed to clear storage');
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalMealDays: number;
  lastSync: Date | null;
  storageKeys: string[];
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mealDates = await getAllMealDates();
    const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    return {
      totalMealDays: mealDates.length,
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      storageKeys: keys,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalMealDays: 0,
      lastSync: null,
      storageKeys: [],
    };
  }
}

/**
 * Delete old meal data (keep only recent days)
 */
export async function cleanupOldMeals(daysToKeep: number = 90): Promise<number> {
  try {
    const allDates = await getAllMealDates();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = formatDateKey(cutoffDate);

    let deletedCount = 0;

    for (const dateString of allDates) {
      if (dateString < cutoffString) {
        const key = `${STORAGE_KEYS.MEALS_PREFIX}${dateString}`;
        await AsyncStorage.removeItem(key);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old meals:', error);
    return 0;
  }
}

/**
 * Export all data for backup
 */
export async function exportAllData(): Promise<string> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);

    const data: Record<string, any> = {};
    items.forEach(([key, value]) => {
      if (value) {
        data[key] = JSON.parse(value);
      }
    });

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from backup
 */
export async function importAllData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    const entries: [string, string][] = Object.entries(data).map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(entries);
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data');
  }
}
