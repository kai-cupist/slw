import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { ApiError, api } from '../../lib/api';
import type { Evaluation, Submission } from '../../lib/types';

export default function WriteScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lastSavedContent = useRef('');

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Submission>(`/submissions/${submissionId}`);
      setSubmission(data);
      setContent(data.content ?? '');
      lastSavedContent.current = data.content ?? '';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('답안을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleSave = async () => {
    if (!submissionId || saving) return;
    setSaving(true);
    try {
      await api.patch<Submission>(`/submissions/${submissionId}`, { content });
      lastSavedContent.current = content;
      Alert.alert('저장 완료', '임시저장되었습니다.');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : '저장에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId || submitting) return;

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      Alert.alert('입력 필요', '답안을 작성해 주세요.');
      return;
    }

    // 변경 사항이 있으면 먼저 저장
    if (content !== lastSavedContent.current) {
      try {
        await api.patch<Submission>(`/submissions/${submissionId}`, {
          content,
        });
        lastSavedContent.current = content;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : '저장에 실패했습니다.';
        Alert.alert('오류', message);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. 제출
      await api.patch<Submission>(`/submissions/${submissionId}/submit`);

      // 2. 평가 요청
      await api.post<Evaluation>(`/submissions/${submissionId}/evaluate`, {});

      // 3. 결과 화면으로 이동
      router.replace(`/evaluation/${submissionId}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : '제출 중 오류가 발생했습니다. 다시 시도해 주세요.';
      Alert.alert('오류', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>답안을 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !submission) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ?? '답안을 찾을 수 없습니다.'}
        </Text>
        <Pressable style={styles.retryButton} onPress={fetchSubmission}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const isSubmitted = submission.status !== 'draft';
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
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          editable={!isSubmitted && !submitting}
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
              disabled={saving || submitting}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <Text style={styles.saveButtonText}>임시저장</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
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
  },
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
  scroll: {
    flexGrow: 1,
    padding: 16,
  },
  statusBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 300,
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  unsavedHint: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  saveButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
