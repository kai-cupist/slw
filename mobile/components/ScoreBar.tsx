import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { scoreColor } from '../lib/theme';

interface ScoreBarProps {
  label: string;
  score: number;
  size?: 'normal' | 'mini';
}

/**
 * 점수 프로그레스 바
 * - size='normal'(기본): 라벨 w80, 바 h10, 값 w28
 * - size='mini': 라벨 w36, 바 h6, 값 w24
 */
export function ScoreBar({ label, score, size = 'normal' }: ScoreBarProps) {
  const isMini = size === 'mini';
  const color = scoreColor(score);

  const labelStyle = isMini ? styles.labelMini : styles.labelNormal;
  const barStyle = isMini ? styles.barMini : styles.barNormal;
  const valueStyle = isMini ? styles.valueMini : styles.valueNormal;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View style={[styles.barContainer, barStyle]}>
        {/* width % 는 인라인으로 — StyleSheet.create에 % 문자열 금지 */}
        <View
          style={[
            styles.barFill,
            barStyle,
            { width: `${(score / 10) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.value, valueStyle, { color }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#555',
  },
  labelNormal: {
    width: 80,
    fontSize: 14,
  },
  labelMini: {
    width: 36,
    fontSize: 12,
  },
  barContainer: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barNormal: {
    height: 10,
  },
  barMini: {
    height: 6,
  },
  barFill: {
    borderRadius: 5,
  },
  value: {
    fontWeight: '600',
    textAlign: 'right',
  },
  valueNormal: {
    width: 28,
    fontSize: 16,
  },
  valueMini: {
    width: 24,
    fontSize: 12,
  },
});
