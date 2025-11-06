/**
 * Summary Screen - Daily summary with circular progress and macro breakdown
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/contexts/AppContext';
import { COLORS, MACRO_EMOJIS } from '@/constants/mockData';
import { CircularProgress } from '@/components/CircularProgress';
import { MealEntryCard } from '@/components/MealEntryCard';

export default function SummaryScreen() {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  const { state } = useApp();

  // Calculate macro percentages
  const proteinPercentage = state.settings.targetProtein > 0
    ? (state.totalProtein / state.settings.targetProtein) * 100
    : 0;
  const carbsPercentage = state.settings.targetCarbs > 0
    ? (state.totalCarbs / state.settings.targetCarbs) * 100
    : 0;
  const fatPercentage = state.settings.targetFat > 0
    ? (state.totalFat / state.settings.targetFat) * 100
    : 0;

  const macroData = [
    {
      emoji: MACRO_EMOJIS.protein,
      label: 'Protein',
      value: state.totalProtein,
      target: state.settings.targetProtein,
      unit: 'g',
      percentage: proteinPercentage,
      color: '#FF6B6B',
    },
    {
      emoji: MACRO_EMOJIS.carbs,
      label: 'Carbs',
      value: state.totalCarbs,
      target: state.settings.targetCarbs,
      unit: 'g',
      percentage: carbsPercentage,
      color: '#4ECDC4',
    },
    {
      emoji: MACRO_EMOJIS.fat,
      label: 'Fat',
      value: state.totalFat,
      target: state.settings.targetFat,
      unit: 'g',
      percentage: fatPercentage,
      color: '#FFD93D',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>Daily Summary</Text>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Circular Progress */}
        <View style={styles.progressContainer}>
          <CircularProgress
            consumed={state.totalCalories}
            goal={state.settings.dailyCalorieGoal}
            size={240}
            strokeWidth={20}
          />
        </View>

        {/* Remaining Calories */}
        <View style={[styles.remainingCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>
            {state.totalCalories > state.settings.dailyCalorieGoal ? 'Over Goal' : 'Remaining'}
          </Text>
          <Text
            style={[
              styles.remainingValue,
              {
                color:
                  state.totalCalories > state.settings.dailyCalorieGoal
                    ? colors.caloriePositive
                    : colors.success,
              },
            ]}
          >
            {state.totalCalories > state.settings.dailyCalorieGoal
              ? `+${(state.totalCalories - state.settings.dailyCalorieGoal).toLocaleString()}`
              : (state.settings.dailyCalorieGoal - state.totalCalories).toLocaleString()}{' '}
            cal
          </Text>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MACRO BREAKDOWN
          </Text>

          {macroData.map((macro, index) => (
            <View
              key={index}
              style={[
                styles.macroCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              <View style={styles.macroHeader}>
                <View style={styles.macroLabelContainer}>
                  <Text style={styles.macroEmoji}>{macro.emoji}</Text>
                  <Text style={[styles.macroLabel, { color: colors.text }]}>{macro.label}</Text>
                </View>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {Math.round(macro.value)} / {macro.target} {macro.unit}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.macroProgressBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      backgroundColor: macro.color,
                      width: `${Math.min(macro.percentage, 100)}%`,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.macroPercentage, { color: colors.textSecondary }]}>
                {macro.percentage.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Meal History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            TODAY'S MEALS ({state.meals.length})
          </Text>

          {state.meals.length > 0 ? (
            state.meals.map((meal) => <MealEntryCard key={meal.id} meal={meal} />)
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No meals logged yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  remainingCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  remainingLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  macroCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroEmoji: {
    fontSize: 20,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroProgressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyCard: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
