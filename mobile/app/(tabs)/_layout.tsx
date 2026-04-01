import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
              size={24}
              tintColor={color}
              weight={focused ? 'semibold' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '제출 이력',
          tabBarLabel: '이력',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
              size={24}
              tintColor={color}
              weight={focused ? 'semibold' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
