import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryBadge, DifficultyBadge } from '../../components/Badge';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { usePrompt, usePromptDraft } from '../../lib/hooks/queries';
import { colors, radius, shadow, spacing, typography } from '../../lib/theme';

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: prompt, isLoading, error } = usePrompt(id);
  const { data: draftResult, isLoading: draftLoading } = usePromptDraft(id);
  const existingDraft = draftResult?.items[0] ?? null;

  const handleContinueWriting = () => {
    if (!existingDraft) return;
    router.push(`/write?submissionId=${existingDraft.id}`);
  };

  const handleStartWriting = () => {
    if (!id) return;
    router.push(`/write?promptId=${id}`);
  };

  if (isLoading) {
    return <LoadingView text="주제를 불러오는 중..." />;
  }

  if (error || !prompt) {
    return (
      <ErrorView
        message={error?.message ?? '주제를 찾을 수 없습니다.'}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{prompt.title}</Text>

        <View style={styles.metaRow}>
          <CategoryBadge category={prompt.category} />
          <DifficultyBadge difficulty={prompt.difficulty} />
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>주제 설명</Text>
          <Text style={styles.description}>{prompt.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {existingDraft ? (
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinueWriting}
          >
            <Text style={styles.buttonText}>이어서 작성</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.buttonPressed,
              draftLoading && styles.buttonDisabled,
            ]}
            onPress={handleStartWriting}
            disabled={draftLoading}
          >
            {draftLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>작성 시작</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  descriptionLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.bar,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});
