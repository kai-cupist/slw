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
import { colors, radius, shadow, spacing, typography } from '../../lib/theme';
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
        <ActivityIndicator size="small" color={colors.primary} />
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
      style={styles.flatList}
      refreshing={isFetching && !isFetchingNextPage}
      onRefresh={refetch}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
    />
  );
}

const styles = StyleSheet.create({
  flatList: {
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
