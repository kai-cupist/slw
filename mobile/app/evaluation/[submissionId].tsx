import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError, api } from '../../lib/api';
import type { Evaluation } from '../../lib/types';

/** 점수 항목 라벨 매핑 */
const SCORE_LABELS: Record<string, string> = {
  grammar: '문법',
  logic: '논리',
  expression: '표현력',
  relevance: '주제 적절성',
};

/** 점수 항목 키 (표시 순서) */
const SCORE_KEYS = ['grammar', 'logic', 'expression', 'relevance'] as const;

/** 점수 구간별 색상 */
function scoreColor(score: number): string {
  if (score >= 8) return '#4CAF50';
  if (score >= 5) return '#FF9800';
  return '#F44336';
}

/** 점수 프로그레스 바 */
function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  const widthPercent = (score / 10) * 100;

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.barContainer}>
        <View
          style={[styles.barFill, { width: `${widthPercent}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
    </View>
  );
}

export default function EvaluationScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const router = useRouter();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Evaluation>(
        `/evaluations/${submissionId}`,
      );
      setEvaluation(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('평가 결과를 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>평가 결과를 불러오는 중...</Text>
      </View>
    );
  }

  if (error != null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchEvaluation}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (evaluation == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>평가 결과가 없습니다.</Text>
      </View>
    );
  }

  const feedback = evaluation.feedback;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* 총점 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>총점</Text>
        <Text style={[styles.totalScore, { color: scoreColor(evaluation.total_score) }]}>
          {evaluation.total_score}
        </Text>
        <Text style={styles.totalMax}> / 10</Text>
      </View>

      {/* 항목별 점수 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>항목별 점수</Text>
        {SCORE_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={SCORE_LABELS[key]}
            score={evaluation[`${key}_score`]}
          />
        ))}
      </View>

      {/* 항목별 피드백 */}
      {feedback != null ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 피드백</Text>

          {SCORE_KEYS.map((key) => {
            const text = feedback[key];
            return text ? (
              <View key={key} style={styles.feedbackCard}>
                <Text style={styles.feedbackLabel}>{SCORE_LABELS[key]}</Text>
                <Text style={styles.feedbackText}>{text}</Text>
              </View>
            ) : null;
          })}

          {feedback.overall ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>종합 의견</Text>
              <Text style={styles.feedbackText}>{feedback.overall}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 목록으로 돌아가기 */}
      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>돌아가기</Text>
      </Pressable>
    </ScrollView>
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: '700',
  },
  totalMax: {
    fontSize: 18,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    width: 80,
    fontSize: 14,
    color: '#555',
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreValue: {
    width: 28,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  feedbackCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
