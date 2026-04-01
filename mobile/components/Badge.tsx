import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../lib/theme';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.label,
  },
});

/** 난이도 뱃지 */
export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const bg = colors.difficulty[difficulty] ?? '#9E9E9E';
  return (
    <View style={[styles.badge, { backgroundColor: bg + '22' }]}>
      <Text style={[styles.badgeText, { color: bg }]}>
        {difficulty}
      </Text>
    </View>
  );
}

/** 카테고리 뱃지 */
export function CategoryBadge({ category }: { category: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.primarySurface }]}>
      <Text style={[styles.badgeText, { color: colors.primary }]}>
        {category}
      </Text>
    </View>
  );
}

/** 상태 뱃지 — 일반용 */
export function StatusBadge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}
