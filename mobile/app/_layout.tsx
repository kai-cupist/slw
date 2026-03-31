import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';

import { useUserStore } from '../stores/userStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isLoaded = useUserStore((s) => s.isLoaded);
  const loadUserId = useUserStore((s) => s.loadUserId);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="prompts/[id]"
          options={{ title: '주제 상세', headerBackTitle: '목록' }}
        />
        <Stack.Screen
          name="write/[submissionId]"
          options={{ title: '답안 작성', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="evaluation/[submissionId]"
          options={{ title: '평가 결과', headerBackTitle: '뒤로' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
