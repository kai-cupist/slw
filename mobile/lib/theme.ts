/**
 * 디자인 토큰 — 앱 전체 색상, 간격, 반경, 그림자, 타이포그래피
 *
 * 팔레트: Indigo 기반 프리미엄 디자인 시스템 (2026 트렌드)
 * - 주조색: Indigo (#5C6BC0) — 지적이고 신뢰감 있는 학습 앱 컨셉
 * - 배경: 따뜻한 오프화이트 (#F8F7FF) — 순백보다 눈에 부드러움
 * - 카드: 순백 (#FFFFFF) with 정제된 그림자
 * - 성공: Emerald (#2E7D32), 경고: Amber (#F57C00), 위험: Rose (#C62828)
 */

export const colors = {
  // ── 주조색 (Indigo) ──────────────────────────────────────────
  primary: '#5C6BC0',        // Indigo 500
  primaryLight: '#8E99F3',  // Indigo 300 — 밝은 하이라이트
  primaryDark: '#3949AB',   // Indigo 700 — 프레스 상태, 강조
  primarySurface: '#EDE7F6', // Indigo 50 — 배지 배경, 연한 강조

  // ── 상태 색상 ────────────────────────────────────────────────
  success: '#2E7D32',        // Green 800
  successLight: '#E8F5E9',  // Green 50
  warning: '#F57C00',        // Orange 700
  warningLight: '#FFF3E0',  // Orange 50
  danger: '#C62828',         // Red 800
  dangerLight: '#FFEBEE',   // Red 50

  // ── 배경 & 서피스 ────────────────────────────────────────────
  background: '#F8F7FF',     // 따뜻한 오프화이트 (Indigo 미세 틴트)
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF', // 카드 배경
  inputBackground: '#F3F2FA', // 입력창 배경

  // ── 텍스트 ───────────────────────────────────────────────────
  textPrimary: '#1A1A2E',    // 거의 검정 — 따뜻한 다크 네이비
  textSecondary: '#4A4A6A',  // 중간 톤
  textMuted: '#8888AA',      // 힌트, 보조 정보
  textOnPrimary: '#FFFFFF',  // 프라이머리 배경 위 텍스트

  // ── 경계선 ───────────────────────────────────────────────────
  border: '#E2E0F0',         // 연한 Indigo 틴트 경계선
  borderFocus: '#5C6BC0',    // 포커스 상태 경계선

  // ── 난이도 ───────────────────────────────────────────────────
  difficulty: {
    beginner: '#2E7D32',
    intermediate: '#F57C00',
    advanced: '#C62828',
  } as Record<string, string>,

  // ── 카테고리 ─────────────────────────────────────────────────
  category: '#5C6BC0',

  // ── 탭바 ─────────────────────────────────────────────────────
  tabActive: '#5C6BC0',
  tabInactive: '#8888AA',
  tabBackground: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

/** 그림자 레벨 — elevation 기반 3단계 */
export const shadow = {
  /** 카드, 기본 요소 */
  card: {
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  /** 헤더, 하단 바 */
  bar: {
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  /** 모달, 높은 요소 */
  elevated: {
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

/** 타이포그래피 시스템 */
export const typography = {
  /** 화면 제목 */
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.5 },
  /** 섹션 제목 */
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
  /** 카드 제목 */
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  /** 본문 */
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  /** 보조 본문 */
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  /** 레이블, 뱃지 */
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.3 },
  /** 숫자 점수 */
  score: { fontSize: 48, fontWeight: '800' as const, lineHeight: 56, letterSpacing: -1 },
  /** 버튼 */
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

/** 점수 구간별 색상 — 8 이상: success, 5 이상: warning, 미만: danger */
export function scoreColor(score: number): string {
  if (score >= 8) return colors.success;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

/** 점수 구간별 배경색 */
export function scoreBgColor(score: number): string {
  if (score >= 8) return colors.successLight;
  if (score >= 5) return colors.warningLight;
  return colors.dangerLight;
}
