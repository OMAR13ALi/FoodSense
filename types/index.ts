/**
 * TypeScript types for the Calorie Tracker App
 */

// Meal entry interface
export interface MealEntry {
  id: string;
  text: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: Date;
  isLoading?: boolean;
  // AI metadata fields
  aiExplanation?: string; // AI's reasoning about the nutrition data
  confidence?: number; // 0-1 confidence score from AI
  sources?: string[]; // Data sources used by AI
  error?: string; // Error message if AI analysis failed
}

// User settings interface
export interface UserSettings {
  dailyCalorieGoal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealReminders: boolean;
  trackWater: boolean;
  darkMode: boolean;
}

// App state interface
export interface AppState {
  meals: MealEntry[];
  settings: UserSettings;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Action types for context
export type AppAction =
  | { type: 'ADD_MEAL'; payload: MealEntry }
  | { type: 'UPDATE_MEAL'; payload: { id: string; updates: Partial<MealEntry> } }
  | { type: 'DELETE_MEAL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'CLEAR_MEALS' }
  | { type: 'SET_LOADING'; payload: { id: string; isLoading: boolean } };

// Macro nutrient type
export interface MacroNutrient {
  label: string;
  value: number;
  target: number;
  unit: string;
  emoji: string;
  color: string;
}

// AI Analysis Result
export interface AIAnalysisResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  explanation: string;
  confidence?: number;
  sources?: string[];
}

// API Error Type
export interface APIError {
  message: string;
  code?: string;
  retryable: boolean;
}
