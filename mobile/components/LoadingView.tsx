import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '../lib/theme';

interface LoadingViewProps {
  text?: string;
}

export function LoadingView({ text = '불러오는 중…' }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
    ...shadow.card,
  },
  text: {
    marginTop: spacing.md,
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
