import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2196F3',
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '쓰기 주제',
          tabBarLabel: '주제',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '제출 이력',
          tabBarLabel: '이력',
        }}
      />
    </Tabs>
  );
}
