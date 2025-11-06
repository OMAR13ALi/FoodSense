/**
 * MealEntryCard - Displays a meal entry with text and calorie information
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MealEntry } from '@/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';

interface MealEntryCardProps {
  meal: MealEntry;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const MealEntryCard: React.FC<MealEntryCardProps> = ({ meal, onPress, onLongPress }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={[styles.mealText, { color: colors.text }]} numberOfLines={2}>
            {meal.text}
          </Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={[styles.calorieText, { color: colors.caloriePositive }]}>
            + {meal.calories.toLocaleString()} cal
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  mealText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '400',
  },
});
