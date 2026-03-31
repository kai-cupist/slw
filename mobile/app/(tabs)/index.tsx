import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError, api } from '../../lib/api';
import type { PaginatedResponse, Prompt } from '../../lib/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const bg = DIFFICULTY_COLORS[difficulty] ?? '#9E9E9E';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{difficulty}</Text>
    </View>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: '#2196F3' }]}>
      <Text style={styles.badgeText}>{category}</Text>
    </View>
  );
}

export default function PromptsScreen() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<Prompt>>(
        '/prompts?page=1&limit=20',
      );
      setPrompts(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('주제 목록을 불러오지 못했습니다.');
      }
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const renderItem = useCallback(
    ({ item }: { item: Prompt }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/prompts/${item.id}`)}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.badgeRow}>
          <CategoryBadge category={item.category} />
          <DifficultyBadge difficulty={item.difficulty} />
        </View>
      </Pressable>
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Prompt) => String(item.id), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>주제를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchPrompts}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (prompts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>등록된 주제가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
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
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: '#212121',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
