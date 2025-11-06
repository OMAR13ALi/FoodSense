/**
 * Mock data for Phase 1 UI implementation
 */

import { MealEntry, UserSettings } from '@/types';

// Default user settings
export const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieGoal: 2000,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 65,
  mealReminders: false,
  trackWater: true,
  darkMode: false,
};

// Sample meal entries for initial state
export const SAMPLE_MEALS: MealEntry[] = [
  {
    id: '1',
    text: 'Chicken breast with rice and vegetables',
    calories: 520,
    protein: 45,
    carbs: 58,
    fat: 8,
    timestamp: new Date(new Date().setHours(12, 30, 0, 0)),
  },
  {
    id: '2',
    text: 'Greek yogurt with berries and granola',
    calories: 280,
    protein: 18,
    carbs: 42,
    fat: 6,
    timestamp: new Date(new Date().setHours(8, 15, 0, 0)),
  },
  {
    id: '3',
    text: 'Salmon salad with olive oil dressing',
    calories: 450,
    protein: 35,
    carbs: 12,
    fat: 28,
    timestamp: new Date(new Date().setHours(18, 45, 0, 0)),
  },
];

// Emoji indicators for macros
export const MACRO_EMOJIS = {
  calories: '🔥',
  protein: '🥩',
  carbs: '🥖',
  fat: '💧',
  water: '💧',
  meals: '🍽️',
};

// Loading state emojis for search animation
export const LOADING_EMOJIS = ['🔍', '🤔', '💭', '🧠', '✨'];

// Color palette - Apple Notes cream/beige style
export const COLORS = {
  light: {
    background: '#F5F1E8',
    cardBackground: '#F5F1E8',
    primary: '#E8A5D8',
    secondary: '#EFE9DC',
    text: '#2B2416',
    textSecondary: '#8B7D6B',
    border: '#E0D8C8',
    success: '#34C759',
    caloriePositive: '#E8A5D8',
    shadow: 'rgba(0, 0, 0, 0.03)',
    placeholder: '#B5A894',
  },
  dark: {
    background: '#1A1612',
    cardBackground: '#252118',
    primary: '#E8A5D8',
    secondary: '#2C2820',
    text: '#F5F1E8',
    textSecondary: '#9B8D7B',
    border: '#3A342A',
    success: '#32D74B',
    caloriePositive: '#E8A5D8',
    shadow: 'rgba(0, 0, 0, 0.5)',
    placeholder: '#6B5F4F',
  },
};
