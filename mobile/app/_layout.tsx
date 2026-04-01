import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useUserStore } from '../stores/userStore';

const queryClient = new QueryClient();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
