import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '../lib/theme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 오류 아이콘 원형 배지 */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>!</Text>
        </View>

        <Text style={styles.title}>오류가 발생했습니다</Text>
        <Text style={styles.message}>{message}</Text>

        {onRetry ? (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>다시 시도</Text>
          </Pressable>
        ) : null}
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
    width: '100%',
    ...shadow.card,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.danger,
    lineHeight: 34,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadow.bar,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});
