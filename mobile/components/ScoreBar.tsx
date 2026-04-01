import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, scoreColor, typography } from '../lib/theme';

interface ScoreBarProps {
  label: string;
  score: number;
  size?: 'normal' | 'mini';
}

/**
 * 점수 진행 바
 *
 * 그라데이션 효과: 채워진 바 위에 흰색 반투명 레이어를 씌워
 * 왼쪽이 밝고 오른쪽이 어두운 느낌을 줌 (expo-linear-gradient 없이)
 */
export function ScoreBar({ label, score, size = 'normal' }: ScoreBarProps) {
  const isMini = size === 'mini';
  const color = scoreColor(score);
  const fillRatio = Math.min(Math.max(score / 10, 0), 1);

  return (
    <View style={[styles.row, isMini && styles.rowMini]}>
      <Text
        style={[
          styles.label,
          isMini ? styles.labelMini : styles.labelNormal,
        ]}
      >
        {label}
      </Text>

      {/* 트랙 */}
      <View
        style={[
          styles.track,
          isMini ? styles.trackMini : styles.trackNormal,
        ]}
      >
        {/* 채워진 바 (색상 레이어) */}
        <View
          style={[
            styles.fill,
            isMini ? styles.fillMini : styles.fillNormal,
            { width: `${fillRatio * 100}%`, backgroundColor: color },
          ]}
        >
          {/* 하이라이트 오버레이 — 왼쪽 상단 반투명 흰색으로 광택감 */}
          <View style={styles.highlight} />
        </View>
      </View>

      <Text
        style={[
          styles.value,
          isMini ? styles.valueMini : styles.valueNormal,
          { color },
        ]}
      >
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowMini: {
    marginBottom: 6,
  },
  label: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  labelNormal: {
    width: 80,
    fontSize: 14,
  },
  labelMini: {
    width: 36,
    fontSize: 12,
  },
  track: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  trackNormal: {
    height: 8,
  },
  trackMini: {
    height: 5,
  },
  fill: {
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fillNormal: {
    height: 8,
  },
  fillMini: {
    height: 5,
  },
  /** 왼쪽 상단에 반투명 흰색 광택 */
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  value: {
    fontWeight: '700',
    textAlign: 'right',
  },
  valueNormal: {
    width: 28,
    fontSize: 15,
  },
  valueMini: {
    width: 22,
    fontSize: 12,
  },
});
