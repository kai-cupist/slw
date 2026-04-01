import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { colors, shadow, typography } from '../../lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: [
          styles.tabBar,
          Platform.select({ ios: { position: 'absolute' }, default: {} }),
        ],
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: { ...typography.h3, color: colors.textPrimary },
        headerShadowVisible: false,
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
              size={22}
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
              size={22}
              tintColor={color}
              weight={focused ? 'semibold' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBackground,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...shadow.bar,
  },
  tabLabel: {
    ...typography.label,
    fontSize: 11,
  },
  header: {
    backgroundColor: colors.surface,
  },
});
