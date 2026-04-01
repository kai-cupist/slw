import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LoadingView } from '../../components/LoadingView';
import {
  useCreateSubmission,
  useEvaluate,
  useSaveSubmission,
  useSubmitSubmission,
} from '../../lib/hooks/mutations';
import { useSubmission } from '../../lib/hooks/queries';
import { colors, radius, shadow, spacing, typography } from '../../lib/theme';

/**
 * 글쓰기 화면
 *
 * 두 가지 진입 경로:
 * - 신규 작성: ?promptId=1  (submissionId 없음 — 첫 임시저장 시 POST /submissions)
 * - 이어 작성: ?submissionId=4  (기존 draft 로드)
 */
export default function WriteScreen() {
  const { promptId, submissionId: submissionIdParam } = useLocalSearchParams<{
    promptId?: string;
    submissionId?: string;
  }>();
  const router = useRouter();

  // submissionId는 신규 작성 중 첫 저장 이후 생성된다.
  const [submissionId, setSubmissionId] = useState<string | undefined>(
    submissionIdParam,
  );

  const { data: submission, isLoading } = useSubmission(submissionId);

  const [content, setContent] = useState('');
  const lastSavedContent = useRef('');
  const isCreating = useRef(false);

  // 이어 작성: 서버 content로 초기화
  // submission?.id를 의존성으로 사용 — content 변경 시 재실행 방지 (K011)
  useEffect(() => {
    if (submission?.content != null) {
      setContent(submission.content);
      lastSavedContent.current = submission.content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');

  const { mutateAsync: createSubmission } = useCreateSubmission();
  const { mutateAsync: saveSubmission, isPending: saving } =
    useSaveSubmission();
  const { mutateAsync: submitSubmission } = useSubmitSubmission();
  const { mutateAsync: evaluate } = useEvaluate();

  /**
   * draft가 없으면 먼저 생성하고, 있으면 content를 저장한다.
   * 첫 저장 시 POST → 이후 저장은 PATCH.
   */
  const ensureCreatedAndSave = async (text: string): Promise<string> => {
    if (submissionId) {
      await saveSubmission({ submissionId, content: text });
      return submissionId;
    }

    // 중복 호출 방지 (이미 생성 중이면 대기)
    if (isCreating.current) {
      throw new Error('저장 중입니다. 잠시 후 다시 시도해주세요.');
    }

    if (!promptId) {
      throw new Error('주제 정보가 없습니다.');
    }

    isCreating.current = true;
    try {
      const created = await createSubmission(Number(promptId));
      setSubmissionId(String(created.id));
      await saveSubmission({ submissionId: String(created.id), content: text });
      return String(created.id);
    } finally {
      isCreating.current = false;
    }
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      await ensureCreatedAndSave(content);
      lastSavedContent.current = content;
      Alert.alert('저장 완료', '임시저장되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '저장에 실패했습니다.';
      Alert.alert('오류', message);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      Alert.alert('입력 필요', '답안을 작성해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 변경분이 있으면 저장 (없으면 생성만)
      setSubmitPhase('저장 중...');
      let sid = submissionId;
      if (!sid || content !== lastSavedContent.current) {
        sid = await ensureCreatedAndSave(content);
        lastSavedContent.current = content;
      }

      // 2. 제출
      setSubmitPhase('제출 중...');
      await submitSubmission(sid);

      // 3. 평가
      setSubmitPhase('AI 평가 중...');
      await evaluate(sid);

      // 4. 결과 화면
      router.replace(`/evaluation/${sid}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '제출 중 오류가 발생했습니다. 다시 시도해 주세요.';
      Alert.alert('오류', message);
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('');
    }
  };

  // 이어 작성인데 submission 로딩 중
  if (submissionIdParam && isLoading) {
    return <LoadingView text="답안을 불러오는 중..." />;
  }

  if (submissionIdParam && !isLoading && !submission) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>답안을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isSubmitted = submission != null && submission.status !== 'draft';
  const hasUnsaved = content !== lastSavedContent.current;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {isSubmitted ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>이미 제출된 답안입니다.</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.textInput}
          multiline
          placeholder="여기에 답안을 작성하세요..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          editable={!isSubmitted && !isSubmitting}
          textAlignVertical="top"
        />
      </ScrollView>

      {!isSubmitted ? (
        <View style={styles.footer}>
          {hasUnsaved ? (
            <Text style={styles.unsavedHint}>
              저장되지 않은 변경이 있습니다
            </Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving || isSubmitting}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.saveButtonText}>임시저장</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.buttonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving || isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submitInProgress}>
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  <Text style={styles.submitButtonText}>{submitPhase}</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>제출</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  statusBanner: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 300,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.bar,
  },
  unsavedHint: {
    ...typography.label,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  submitInProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
