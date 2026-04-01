import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoadingView } from '../../components/LoadingView';
import { ScoreBar } from '../../components/ScoreBar';
import { useEvaluation, useSubmission } from '../../lib/hooks/queries';
import { colors } from '../../lib/theme';

/** 점수 항목 라벨 매핑 */
const SCORE_LABELS: Record<string, string> = {
  grammar: '문법',
  logic: '논리',
  expression: '표현력',
  relevance: '주제 적절성',
};

/** 점수 항목 키 (표시 순서) */
const SCORE_KEYS = ['grammar', 'logic', 'expression', 'relevance'] as const;

export default function EvaluationScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const router = useRouter();

  const { data: evaluation, isLoading, error } = useEvaluation(submissionId);
  const { data: submission } = useSubmission(submissionId);

  if (isLoading) {
    return <LoadingView text="평가 결과를 불러오는 중..." />;
  }

  if (error != null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error.message}</Text>
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

  const totalColor =
    evaluation.total_score >= 8
      ? colors.success
      : evaluation.total_score >= 5
        ? colors.warning
        : colors.danger;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* 총점 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>총점</Text>
        <Text
          style={[
            styles.totalScore,
            { color: totalColor },
          ]}
        >
          {evaluation.total_score}
        </Text>
        <Text style={styles.totalMax}> / 10</Text>
      </View>

      {/* 작성 내용 */}
      {submission?.content ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>작성 내용</Text>
          <Text style={styles.submissionContent}>{submission.content}</Text>
        </View>
      ) : null}

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
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    marginRight: 8,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: '700',
  },
  totalMax: {
    fontSize: 18,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
    marginBottom: 14,
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
    color: colors.primary,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  backButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  submissionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
});
