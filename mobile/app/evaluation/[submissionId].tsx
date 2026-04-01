import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { ScoreBar } from '../../components/ScoreBar';
import { useEvaluation, useSubmission } from '../../lib/hooks/queries';
import { colors, radius, shadow, spacing, typography } from '../../lib/theme';

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
    return <ErrorView message={error.message} />;
  }

  if (evaluation == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>평가 결과가 없습니다.</Text>
      </View>
    );
  }

  const feedback = evaluation.feedback;

  // K013: scoreColor import 금지 — 인라인 3항 연산으로 처리
  const totalColor =
    evaluation.total_score >= 8
      ? colors.success
      : evaluation.total_score >= 5
        ? colors.warning
        : colors.danger;

  const totalBgColor =
    evaluation.total_score >= 8
      ? colors.successLight
      : evaluation.total_score >= 5
        ? colors.warningLight
        : colors.dangerLight;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* 총점 카드 */}
      <View style={[styles.totalCard, { backgroundColor: totalBgColor }]}>
        <Text style={styles.totalLabel}>총점</Text>
        <View style={styles.totalScoreRow}>
          <Text style={[styles.totalScore, { color: totalColor }]}>
            {evaluation.total_score}
          </Text>
          <Text style={styles.totalMax}>/10</Text>
        </View>
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

      {/* 돌아가기 버튼 */}
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  totalCard: {
    borderRadius: radius.lg,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  totalLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  totalScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  totalScore: {
    ...typography.score,
  },
  totalMax: {
    ...typography.h2,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  feedbackCard: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  submissionContent: {
    ...typography.body,
    color: colors.textSecondary,
  },
  backButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
