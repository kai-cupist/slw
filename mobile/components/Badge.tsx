import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});

/** 난이도 뱃지 — difficulty 값에 따라 색상 결정 */
export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const backgroundColor = colors.difficulty[difficulty] ?? '#9E9E9E';
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.badgeText}>{difficulty}</Text>
    </View>
  );
}

/** 카테고리 뱃지 — primary 색상 고정 */
export function CategoryBadge({ category }: { category: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.category }]}>
      <Text style={styles.badgeText}>{category}</Text>
    </View>
  );
}
