import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { DifficultyBadge } from '../../components/Badge';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
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

const SCORE_LABELS = ['문', '논', '표', '적'] as const;

function TrendChip({ trend }: { trend: ScoreTrend }) {
  const totalColor =
    trend.total_score >= 8
      ? colors.success
      : trend.total_score >= 5
        ? colors.warning
        : colors.danger;
  const totalBg =
    trend.total_score >= 8
      ? colors.successLight
      : trend.total_score >= 5
        ? colors.warningLight
        : colors.dangerLight;
  const subScores = [
    trend.grammar_score,
    trend.logic_score,
    trend.expression_score,
    trend.relevance_score,
  ];

  return (
    <View style={styles.chip}>
      <Text style={styles.chipDate}>{formatDate(trend.evaluated_at)}</Text>
      <View style={[styles.chipBadge, { backgroundColor: totalBg }]}>
        <Text style={[styles.chipTotal, { color: totalColor }]}>
          {trend.total_score}
        </Text>
        <Text style={[styles.chipTotalUnit, { color: totalColor }]}>점</Text>
      </View>
      <View style={styles.chipDots}>
        {subScores.map((score, i) => (
          <View key={SCORE_LABELS[i]} style={styles.chipDotCol}>
            <View
              style={[
                styles.chipDot,
                {
                  backgroundColor:
                    score >= 8
                      ? colors.success
                      : score >= 5
                        ? colors.warning
                        : colors.danger,
                },
              ]}
            />
            <Text style={styles.chipDotLabel}>{SCORE_LABELS[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 점수 추이 섹션 */
function TrendSection() {
  const { data: trends, isLoading, error } = useScoreTrend();

  if (isLoading || error || !trends || trends.length === 0) return null;

  return (
    <View style={styles.trendSection}>
      <Text style={styles.trendTitle}>점수 추이</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendScroll}
      >
        {trends.map((t: ScoreTrend, idx: number) => (
          <TrendChip key={`${t.evaluated_at}-${idx}`} trend={t} />
        ))}
      </ScrollView>
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
      const accentColor =
        item.total_score >= 8
          ? colors.success
          : item.total_score >= 5
            ? colors.warning
            : colors.danger;

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
            <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.prompt_title}
                </Text>
                <Text style={[styles.cardScore, { color: accentColor }]}>
                  {item.total_score}
                  <Text style={styles.cardScoreUnit}>점</Text>
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <DifficultyBadge difficulty={item.prompt_difficulty} />
                <Text style={styles.cardDate}>
                  {formatDate(item.evaluated_at)}
                </Text>
              </View>
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
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.background,
  },
  // ── History card ──
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.72,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  cardScore: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardScoreUnit: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  trendTitle: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  trendScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  // ── Trend chip ──
  chip: {
    width: 80,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipDate: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  chipBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 1,
  },
  chipTotal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chipTotalUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  chipDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipDotCol: {
    alignItems: 'center',
    gap: 2,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  chipDotLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textMuted,
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
