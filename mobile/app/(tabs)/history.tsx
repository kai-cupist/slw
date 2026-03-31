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
import type {
  EvaluationHistory,
  PaginatedResponse,
  ScoreTrend,
} from '../../lib/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

/** 점수 구간별 색상 */
function scoreColor(score: number): string {
  if (score >= 8) return '#4CAF50';
  if (score >= 5) return '#FF9800';
  return '#F44336';
}

/** 날짜 포맷 (YYYY.MM.DD) */
function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 점수 추이 아이템의 미니 바 */
function MiniBar({ score, label }: { score: number; label: string }) {
  const color = scoreColor(score);
  const widthPercent = (score / 10) * 100;
  return (
    <View style={styles.miniBarRow}>
      <Text style={styles.miniBarLabel}>{label}</Text>
      <View style={styles.miniBarContainer}>
        <View
          style={[
            styles.miniBarFill,
            { width: `${widthPercent}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.miniBarValue, { color }]}>{score}</Text>
    </View>
  );
}

/** 점수 추이 섹션 */
function TrendSection() {
  const [trends, setTrends] = useState<ScoreTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const data = await api.get<ScoreTrend[]>(
          '/evaluations/scores/trend?limit=10',
        );
        if (!cancelled) {
          setTrends(data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  // 에러 또는 로딩 중이면 섹션 숨김
  if (error || loading) return null;
  if (trends.length === 0) return null;

  return (
    <View style={styles.trendSection}>
      <Text style={styles.trendTitle}>점수 추이 (최근 {trends.length}건)</Text>
      {trends.map((t, idx) => (
        <View key={`${t.evaluated_at}-${idx}`} style={styles.trendItem}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendDate}>{formatDate(t.evaluated_at)}</Text>
            <Text
              style={[styles.trendTotal, { color: scoreColor(t.total_score) }]}
            >
              {t.total_score}점
            </Text>
          </View>
          <View style={styles.trendBars}>
            <MiniBar score={t.grammar_score} label="문법" />
            <MiniBar score={t.logic_score} label="논리" />
            <MiniBar score={t.expression_score} label="표현" />
            <MiniBar score={t.relevance_score} label="적절" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();

  const [items, setItems] = useState<EvaluationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<EvaluationHistory>>(
        '/evaluations/history?page=1&limit=20',
      );
      setItems(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('이력을 불러오지 못했습니다.');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderItem = useCallback(
    ({ item }: { item: EvaluationHistory }) => {
      const diffColor = DIFFICULTY_COLORS[item.prompt_difficulty] ?? '#9E9E9E';
      return (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(`/evaluation/${item.submission_id}`)}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.prompt_title}
            </Text>
            <Text
              style={[
                styles.cardScore,
                { color: scoreColor(item.total_score) },
              ]}
            >
              {item.total_score}점
            </Text>
          </View>
          <View style={styles.cardBottom}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
              <Text style={styles.diffBadgeText}>{item.prompt_difficulty}</Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.evaluated_at)}</Text>
          </View>
        </Pressable>
      );
    },
    [router],
  );

  const keyExtractor = useCallback(
    (item: EvaluationHistory) => String(item.id),
    [],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>이력을 불러오는 중...</Text>
      </View>
    );
  }

  if (error != null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchHistory}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
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
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  list: {
    padding: 16,
  },
  // ── History card ──
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 12,
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
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  diffBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 13,
    color: '#999',
  },
  // ── Trend section ──
  trendSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  trendItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trendDate: {
    fontSize: 13,
    color: '#888',
  },
  trendTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendBars: {
    gap: 4,
  },
  // ── Mini bar ──
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniBarLabel: {
    width: 36,
    fontSize: 12,
    color: '#777',
  },
  miniBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  miniBarValue: {
    width: 24,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
