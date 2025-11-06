/**
 * App Context for managing global state (meals, settings, etc.)
 */

import React, { createContext, useContext, useReducer, useMemo, ReactNode, useEffect } from 'react';
import { AppState, AppAction, MealEntry, UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/mockData';
import * as StorageService from '@/services/storage-service';

// Calculate totals from meals
const calculateTotals = (meals: MealEntry[]) => {
  return meals.reduce(
    (acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.isLoading ? 0 : meal.calories),
      totalProtein: acc.totalProtein + (meal.isLoading ? 0 : (meal.protein || 0)),
      totalCarbs: acc.totalCarbs + (meal.isLoading ? 0 : (meal.carbs || 0)),
      totalFat: acc.totalFat + (meal.isLoading ? 0 : (meal.fat || 0)),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
};

// Initial state (will be loaded from storage)
const initialState: AppState = {
  meals: [],
  settings: DEFAULT_SETTINGS,
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_MEAL': {
      const newMeals = [...state.meals, action.payload];
      return {
        ...state,
        meals: newMeals,
        ...calculateTotals(newMeals),
      };
    }

    case 'UPDATE_MEAL': {
      const updatedMeals = state.meals.map((meal) =>
        meal.id === action.payload.id ? { ...meal, ...action.payload.updates } : meal
      );
      return {
        ...state,
        meals: updatedMeals,
        ...calculateTotals(updatedMeals),
      };
    }

    case 'DELETE_MEAL': {
      const filteredMeals = state.meals.filter((meal) => meal.id !== action.payload);
      return {
        ...state,
        meals: filteredMeals,
        ...calculateTotals(filteredMeals),
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }

    case 'CLEAR_MEALS': {
      return {
        ...state,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
    }

    case 'SET_LOADING': {
      const updatedMeals = state.meals.map((meal) =>
        meal.id === action.payload.id ? { ...meal, isLoading: action.payload.isLoading } : meal
      );
      return {
        ...state,
        meals: updatedMeals,
      };
    }

    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  updateMeal: (id: string, updates: Partial<MealEntry>) => void;
  deleteMeal: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  clearMeals: () => void;
  getRemainingCalories: () => number;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load meals for today
        const meals = await StorageService.loadMeals(new Date());

        // Load settings
        const savedSettings = await StorageService.loadSettings();
        const settings = savedSettings || DEFAULT_SETTINGS;

        // Dispatch loaded data
        if (savedSettings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }

        // Load meals one by one to trigger recalculation
        meals.forEach(meal => {
          dispatch({ type: 'ADD_MEAL', payload: meal });
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsInitialized(true);
      }
    };

    loadInitialData();
  }, []);

  // Save meals to AsyncStorage whenever they change
  useEffect(() => {
    if (isInitialized && state.meals.length >= 0) {
      StorageService.saveMeals(state.meals, new Date()).catch(error => {
        console.error('Error saving meals:', error);
      });
    }
  }, [state.meals, isInitialized]);

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      StorageService.saveSettings(state.settings).catch(error => {
        console.error('Error saving settings:', error);
      });
    }
  }, [state.settings, isInitialized]);

  // Helper functions
  const addMeal = (meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
    const newMeal: MealEntry = {
      ...meal,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MEAL', payload: newMeal });
  };

  const updateMeal = (id: string, updates: Partial<MealEntry>) => {
    dispatch({ type: 'UPDATE_MEAL', payload: { id, updates } });
  };

  const deleteMeal = (id: string) => {
    dispatch({ type: 'DELETE_MEAL', payload: id });
  };

  const updateSettings = (settings: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const clearMeals = () => {
    dispatch({ type: 'CLEAR_MEALS' });
  };

  const getRemainingCalories = () => {
    return state.settings.dailyCalorieGoal - state.totalCalories;
  };

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      addMeal,
      updateMeal,
      deleteMeal,
      updateSettings,
      clearMeals,
      getRemainingCalories,
    }),
    [state]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
