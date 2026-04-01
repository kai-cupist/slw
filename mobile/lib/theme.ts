/** 디자인 토큰 — 앱 전체 색상, 간격, 반경, 그림자 */

export const colors = {
  primary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  inputBackground: '#FAFAFA',
  textPrimary: '#212121',
  textSecondary: '#666',
  textMuted: '#999',
  border: '#E0E0E0',
  difficulty: {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336',
  } as Record<string, string>,
  category: '#2196F3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
};

/** 점수 구간별 색상 — 8 이상: success, 5 이상: warning, 미만: danger */
export function scoreColor(score: number): string {
  if (score >= 8) return colors.success;
  if (score >= 5) return colors.warning;
  return colors.danger;
}
