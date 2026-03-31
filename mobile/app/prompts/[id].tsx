import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError, api } from '../../lib/api';
import type { Prompt, Submission } from '../../lib/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPrompt = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Prompt>(`/prompts/${id}`);
      setPrompt(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('주제 정보를 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const handleStartWriting = async () => {
    if (!id || creating) return;
    setCreating(true);
    try {
      const submission = await api.post<Submission>('/submissions', {
        prompt_id: Number(id),
      });
      router.push(`/write/${submission.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : '답안을 생성하지 못했습니다.';
      Alert.alert('오류', message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>주제를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !prompt) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ?? '주제를 찾을 수 없습니다.'}
        </Text>
        <Pressable style={styles.retryButton} onPress={fetchPrompt}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const difficultyColor = DIFFICULTY_COLORS[prompt.difficulty] ?? '#9E9E9E';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{prompt.title}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.badgeText}>{prompt.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.badgeText}>{prompt.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.description}>{prompt.description}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
            creating && styles.startButtonDisabled,
          ]}
          onPress={handleStartWriting}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>작성 시작</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
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
});
