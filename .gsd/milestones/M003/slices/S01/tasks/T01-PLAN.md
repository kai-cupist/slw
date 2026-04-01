---
estimated_steps: 29
estimated_files: 2
skills_used: []
---

# T01: 탭 아이콘 추가 및 Stack 헤더 뒤로가기 옵션 정비

expo-symbols의 SymbolView를 사용해 탭 바에 아이콘을 추가하고, Stack.Screen의 헤더 뒤로가기 옵션을 명시적으로 설정한다.

## Steps

1. `mobile/app/(tabs)/_layout.tsx`를 읽는다.
2. 상단에 `import { SymbolView } from 'expo-symbols';`를 추가한다.
3. `index` 탭의 `Tabs.Screen options`에 다음 `tabBarIcon`을 추가한다:
   ```tsx
   tabBarIcon: ({ color, focused }) => (
     <SymbolView
       name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
       size={24}
       tintColor={color}
       weight={focused ? 'semibold' : 'regular'}
     />
   )
   ```
4. `history` 탭의 `Tabs.Screen options`에 다음 `tabBarIcon`을 추가한다:
   ```tsx
   tabBarIcon: ({ color, focused }) => (
     <SymbolView
       name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
       size={24}
       tintColor={color}
       weight={focused ? 'semibold' : 'regular'}
     />
   )
   ```
5. `mobile/app/_layout.tsx`를 읽는다.
6. `prompts/[id]`, `write/index`, `evaluation/[submissionId]` 세 Stack.Screen에 각각 `headerBackButtonDisplayMode: 'minimal'`을 추가한다. `minimal`은 텍스트 없이 화살표만 표시하여 iOS/Android 모두에서 일관된 동작을 제공한다.
7. `cd mobile && npx tsc --noEmit`을 실행해 타입 에러가 없음을 확인한다.

## Inputs

- `mobile/app/(tabs)/_layout.tsx`
- `mobile/app/_layout.tsx`

## Expected Output

- `mobile/app/(tabs)/_layout.tsx`
- `mobile/app/_layout.tsx`

## Verification

cd mobile && npx tsc --noEmit && grep -q 'tabBarIcon' app/\(tabs\)/_layout.tsx && grep -q 'headerBackButtonDisplayMode' app/_layout.tsx
