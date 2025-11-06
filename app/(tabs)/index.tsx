/**
 * Dashboard Screen - Apple Notes style free-writing interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/contexts/AppContext';
import { COLORS } from '@/constants/mockData';
import { CalorieProgressBar } from '@/components/CalorieProgressBar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NutritionDetailsModal } from '@/components/NutritionDetailsModal';
import { MealEntry } from '@/types';
import { analyzeNutrition } from '@/services/ai-service';

interface LineCalories {
  [lineIndex: number]: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealId: string;
    status: 'idle' | 'calculating' | 'sources' | 'done';
  };
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];
  const router = useRouter();

  const { state, addMeal, updateMeal } = useApp();
  const [text, setText] = useState('');
  const [lineCalories, setLineCalories] = useState<LineCalories>({});
  const [currentLine, setCurrentLine] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const debounceTimerRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const textInputRef = useRef<TextInput>(null);

  // Parse text into lines
  const lines = text.split('\n');

  // Calculate current line based on cursor position
  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    const textBeforeCursor = text.substring(0, selection.start);
    const lineIndex = textBeforeCursor.split('\n').length - 1;
    setCurrentLine(lineIndex);
  };

  // Auto-calculate calories for a line when user stops typing
  useEffect(() => {
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines or already calculated lines
      if (!trimmedLine || lineCalories[index]?.status === 'done') {
        return;
      }

      // Clear existing timer for this line
      if (debounceTimerRef.current[index]) {
        clearTimeout(debounceTimerRef.current[index]);
      }

      // Start debounce timer for this line
      debounceTimerRef.current[index] = setTimeout(async () => {
        // Start calculation
        setLineCalories(prev => ({
          ...prev,
          [index]: { calories: 0, protein: 0, carbs: 0, fat: 0, mealId: '', status: 'calculating' },
        }));

        try {
          // Show "sources" status
          setTimeout(() => {
            setLineCalories(prev => ({
              ...prev,
              [index]: { ...prev[index], status: 'sources' },
            }));
          }, 300);

          // Call real AI API
          const result = await analyzeNutrition(trimmedLine);

          const mealId = Date.now().toString() + '-' + index;

          setLineCalories(prev => ({
            ...prev,
            [index]: {
              calories: result.calories,
              protein: result.protein,
              carbs: result.carbs,
              fat: result.fat,
              mealId,
              status: 'done',
            },
          }));

          // Add to meal list in context with AI metadata
          addMeal({
            text: trimmedLine,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            aiExplanation: result.explanation,
            confidence: result.confidence,
            sources: result.sources,
          });
        } catch (error: any) {
          console.error('AI analysis error:', error);

          // Show error state
          setLineCalories(prev => ({
            ...prev,
            [index]: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              mealId: '',
              status: 'done',
            },
          }));

          // Add meal with error
          addMeal({
            text: trimmedLine,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            error: error.message || 'Failed to analyze nutrition',
          });
        }
      }, 800);
    });

    return () => {
      Object.values(debounceTimerRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [text]);

  const navigateToSettings = () => {
    router.push('/(tabs)/settings');
  };

  const handleCalorieTap = (lineIndex: number) => {
    const lineData = lineCalories[lineIndex];
    if (!lineData || lineData.status !== 'done') return;

    const lineMeal = state.meals.find(m => m.text === lines[lineIndex].trim());
    if (lineMeal) {
      setSelectedMeal(lineMeal);
      setModalVisible(true);
    }
  };

  const handleMealUpdate = (updates: Partial<MealEntry>) => {
    if (selectedMeal) {
      updateMeal(selectedMeal.id, updates);

      // Update lineCalories if needed
      const lineIndex = lines.findIndex(line => line.trim() === selectedMeal.text);
      if (lineIndex !== -1 && updates.calories !== undefined) {
        setLineCalories(prev => ({
          ...prev,
          [lineIndex]: {
            ...prev[lineIndex],
            calories: updates.calories!,
            protein: updates.protein || prev[lineIndex].protein,
            carbs: updates.carbs || prev[lineIndex].carbs,
            fat: updates.fat || prev[lineIndex].fat,
          },
        }));
      }
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedMeal(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={[styles.todayText, { color: colors.text }]}>Today</Text>
          <Pressable onPress={navigateToSettings} style={styles.iconButton}>
            <IconSymbol name="gearshape.fill" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Full Screen Text Editor */}
        <View style={styles.editorContainer}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.textEditor,
              {
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            multiline
            placeholder=""
            placeholderTextColor={colors.placeholder}
            value={text}
            onChangeText={setText}
            onSelectionChange={handleSelectionChange}
            autoFocus
            textAlignVertical="top"
          />

          {/* Inline Calorie Overlays */}
          <View style={styles.calorieOverlay}>
            {lines.map((line, index) => {
              const lineData = lineCalories[index];
              if (!line.trim() || !lineData) return null;

              return (
                <View
                  key={index}
                  style={[
                    styles.calorieLineContainer,
                    { top: index * 22 + 16 }, // 22 is line height, 16 is top padding
                  ]}
                  pointerEvents={lineData.status === 'done' ? 'auto' : 'none'}
                >
                  {lineData.status === 'calculating' && (
                    <Text style={[styles.calorieText, { color: colors.textSecondary }]}>
                      calculating...
                    </Text>
                  )}
                  {lineData.status === 'sources' && (
                    <Text style={[styles.calorieText, { color: colors.textSecondary }]}>
                      sources
                    </Text>
                  )}
                  {lineData.status === 'done' && (
                    <Pressable onPress={() => handleCalorieTap(index)}>
                      <Text style={[styles.calorieText, { color: colors.caloriePositive }]}>
                        + {lineData.calories} cal
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom Calorie Progress Bar */}
        <CalorieProgressBar
          consumed={state.totalCalories}
          goal={state.settings.dailyCalorieGoal}
          onPress={() => textInputRef.current?.focus()}
        />

        {/* Nutrition Details Modal */}
        <NutritionDetailsModal
          visible={modalVisible}
          meal={selectedMeal}
          onClose={handleModalClose}
          onUpdate={handleMealUpdate}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  todayText: {
    fontSize: 28,
    fontWeight: '700',
  },
  iconButton: {
    padding: 4,
  },
  editorContainer: {
    flex: 1,
    position: 'relative',
  },
  textEditor: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  calorieOverlay: {
    position: 'absolute',
    right: 20,
    top: 0,
    paddingVertical: 16,
  },
  calorieLineContainer: {
    position: 'absolute',
    right: 0,
    height: 22,
    justifyContent: 'center',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '400',
  },
});
