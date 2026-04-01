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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{prompt.title}</Text>

        <View style={styles.metaRow}>
          <CategoryBadge category={prompt.category} />
          <DifficultyBadge difficulty={prompt.difficulty} />
        </View>

        <Text style={styles.description}>{prompt.description}</Text>
      </ScrollView>

      <View style={styles.footer}>
        {existingDraft ? (
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={handleContinueWriting}
          >
            <Text style={styles.startButtonText}>이어서 작성</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
              draftLoading && styles.startButtonDisabled,
            ]}
            onPress={handleStartWriting}
            disabled={draftLoading}
          >
            {draftLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>작성 시작</Text>
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
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonPressed: {
    opacity: 0.8,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
