import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, typography } from '../lib/theme';
import { useUserStore } from '../stores/userStore';

const queryClient = new QueryClient();
const { width, height } = Dimensions.get('window');

/** 앱 정체성 스플래시 — 국어 교과서 표지 */
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. 이미지 페이드인
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start(() => {
      // 2. 텍스트 슬라이드업 + 페이드인
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. 1.4초 대기 후 페이드아웃
        setTimeout(() => {
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => onFinish());
        }, 1400);
      });
    });
  }, [imageOpacity, textOpacity, textY, screenOpacity, onFinish]);

  return (
    <Animated.View style={[styles.splash, { opacity: screenOpacity }]}>
      {/* 배경 이미지 */}
      <Animated.Image
        source={require('../assets/images/background_image.jpg')}
        style={[styles.splashImage, { opacity: imageOpacity }]}
        resizeMode="cover"
      />
      {/* 반투명 오버레이 */}
      <View style={styles.splashOverlay} />
      {/* 텍스트 */}
      <Animated.View
        style={[
          styles.splashTextBox,
          { opacity: textOpacity, transform: [{ translateY: textY }] },
        ]}
      >
        <Text style={styles.splashTitle}>말하기·듣기·쓰기</Text>
        <Text style={styles.splashSub}>글쓰기로 성장하는 언어 학습</Text>
      </Animated.View>
    </Animated.View>
  );
}

/** 내비게이션 테마 — Indigo 팔레트 */
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export default function RootLayout() {
  const isLoaded = useUserStore((s) => s.isLoaded);
  const loadUserId = useUserStore((s) => s.loadUserId);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  // userId 로드 전에는 스플래시가 자연스럽게 커버
  if (showSplash || !isLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}
        {/* isLoaded 되지 않았으면 스플래시 뒤에 숨어 대기 */}
        {!showSplash && !isLoaded && (
          <View style={styles.loadingBg} />
        )}
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={AppTheme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.primary,
              headerTitleStyle: { ...typography.h3, color: colors.textPrimary },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="prompts/[id]"
              options={{ title: '주제 상세', headerBackButtonDisplayMode: 'minimal' }}
            />
            <Stack.Screen
              name="write/index"
              options={{ title: '답안 작성', headerBackButtonDisplayMode: 'minimal' }}
            />
            <Stack.Screen
              name="evaluation/[submissionId]"
              options={{ title: '평가 결과', headerBackButtonDisplayMode: 'minimal' }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    width,
    height,
    zIndex: 999,
    backgroundColor: '#F8F7FF',
  },
  splashImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  splashOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(26, 26, 46, 0.38)',
  },
  splashTextBox: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  splashTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  splashSub: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loadingBg: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
