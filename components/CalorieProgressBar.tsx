/**
 * CalorieProgressBar - Bottom floating bar showing calorie progress
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CalorieProgressBarProps {
  consumed: number;
  goal: number;
  onPress?: () => void;
}

export const CalorieProgressBar: React.FC<CalorieProgressBarProps> = ({
  consumed,
  goal,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  const remaining = goal - consumed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>
          Remaining
        </Text>
        <Text style={[styles.calorieText, { color: colors.text }]}>
          {remaining.toLocaleString()} cal
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  calorieText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
