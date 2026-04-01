import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { DifficultyBadge } from '../../components/Badge';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { ScoreBar } from '../../components/ScoreBar';
import { useDeleteSubmission } from '../../lib/hooks/mutations';
import { useEvaluationHistory, useScoreTrend } from '../../lib/hooks/queries';
import { colors, radius, shadow, spacing, typography } from '../../lib/theme';
import type { EvaluationHistory, ScoreTrend } from '../../lib/types';

/** 날짜 포맷 (YYYY.MM.DD) */
function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 점수 추이 섹션 */
function TrendSection() {
  const { data: trends, isLoading, error } = useScoreTrend();

  if (isLoading || error) return null;
  if (!trends || trends.length === 0) return null;

  return (
    <View style={styles.trendSection}>
      <Text style={styles.trendTitle}>점수 추이 (최근 {trends.length}건)</Text>
      {trends.map((t: ScoreTrend, idx: number) => (
        <View key={`${t.evaluated_at}-${idx}`} style={styles.trendItem}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendDate}>{formatDate(t.evaluated_at)}</Text>
            <Text
              style={[
                styles.trendTotal,
                {
                  color:
                    t.total_score >= 8
                      ? colors.success
                      : t.total_score >= 5
                        ? colors.warning
                        : colors.danger,
                },
              ]}
            >
              {t.total_score}점
            </Text>
          </View>
          <View style={styles.trendBars}>
            <ScoreBar score={t.grammar_score} label="문법" size="mini" />
            <ScoreBar score={t.logic_score} label="논리" size="mini" />
            <ScoreBar score={t.expression_score} label="표현" size="mini" />
            <ScoreBar score={t.relevance_score} label="적절" size="mini" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
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
  } = useEvaluationHistory();
  const { refetch: refetchTrend } = useScoreTrend();
  const deleteMutation = useDeleteSubmission();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
    refetchTrend();
  }, [refetch, refetchTrend]);

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

  const renderRightActions = useCallback(
    // eslint-disable-next-line react/display-name
    (item: EvaluationHistory) => () => (
      <Pressable
        style={[
          styles.deleteAction,
          { opacity: deleteMutation.isPending ? 0.5 : 1 },
        ]}
        disabled={deleteMutation.isPending}
        onPress={() => {
          Alert.alert('삭제', '이 이력을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () => deleteMutation.mutate(String(item.submission_id)),
            },
          ]);
        }}
      >
        <Text style={styles.deleteActionText}>삭제</Text>
      </Pressable>
    ),
    [deleteMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: EvaluationHistory }) => {
      return (
        <ReanimatedSwipeable
          renderRightActions={renderRightActions(item)}
          overshootRight={false}
        >
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(`/evaluation/${item.submission_id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.prompt_title}
              </Text>
              <Text
                style={[
                  styles.cardScore,
                  {
                    color:
                      item.total_score >= 8
                        ? colors.success
                        : item.total_score >= 5
                          ? colors.warning
                          : colors.danger,
                  },
                ]}
              >
                {item.total_score}점
              </Text>
            </View>
            <View style={styles.cardBottom}>
              <DifficultyBadge difficulty={item.prompt_difficulty} />
              <Text style={styles.cardDate}>
                {formatDate(item.evaluated_at)}
              </Text>
            </View>
          </Pressable>
        </ReanimatedSwipeable>
      );
    },
    [router, renderRightActions],
  );

  const keyExtractor = useCallback(
    (item: EvaluationHistory) => String(item.id),
    [],
  );

  if (isLoading) {
    return <LoadingView text="이력을 불러오는 중..." />;
  }

  if (error != null) {
    return <ErrorView message={error.message} onRetry={refetch} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>아직 평가 이력이 없습니다.</Text>
        <Text style={styles.emptySubtext}>
          주제를 선택하고 답안을 제출해 보세요.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<TrendSection />}
      refreshing={isFetching && !isFetchingNextPage}
      onRefresh={handleRefresh}
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
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  // ── History card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  cardScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  // ── Trend section ──
  trendSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  trendTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  trendItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  trendTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendBars: {
    gap: spacing.xs,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  // ── Swipe delete ──
  deleteAction: {
    width: 80,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: radius.md,
  },
  deleteActionText: {
    color: colors.textOnPrimary,
    ...typography.label,
  },
});
