import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryBadge, DifficultyBadge } from '../../components/Badge';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { usePrompts } from '../../lib/hooks/queries';
import type { Prompt } from '../../lib/types';

export default function PromptsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = usePrompts();

  const prompts = data?.pages.flatMap((p) => p.items) ?? [];

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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  }, [isFetchingNextPage]);

  if (isLoading) {
    return <LoadingView text="주제를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorView message={error.message} onRetry={refetch} />;
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
      refreshing={isFetching && !isFetchingNextPage}
      onRefresh={refetch}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
