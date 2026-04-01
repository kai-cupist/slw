# M003/S01 — 네비게이션 UI 개선 (탭 아이콘·뒤로가기) — Research

**Date:** 2026-04-01

## Summary

현재 탭 바에 `tabBarIcon`이 전혀 설정되어 있지 않다. `(tabs)/_layout.tsx`의 각 `Tabs.Screen`에는 `title`과 `tabBarLabel`만 있고 아이콘 없다. 탭 아이콘이 없으면 기본 회색 박스가 표시되거나, iOS/Android에 따라 빈 공간으로 보인다.

뒤로가기 관련해서는 `_layout.tsx`의 Stack.Screen 3개가 `headerBackTitle`을 설정하고 있지만, `headerBackTitle`은 iOS 전용 옵션이다. Android에서는 이 텍스트가 노출되지 않는다. react-navigation의 Stack 헤더 기본 뒤로가기 버튼 동작(좌상단 화살표)은 이미 동작 중이므로, "깔끔하게 동작"의 의미는 아이콘 크기/색상 일관성 조정이나 `headerBackButtonDisplayMode` 제어일 가능성이 높다.

아이콘 라이브러리 상황: `expo-symbols`(v~55.0.5)가 이미 설치되어 있다. iOS SF Symbols + Android Material Symbols를 모두 지원하는 크로스 플랫폼 라이브러리다. `@expo/vector-icons`는 설치되어 있지 않다.

## Recommendation

`expo-symbols`의 `SymbolView`를 `tabBarIcon`에 사용하여 탭 아이콘을 추가한다. `SymbolView`는 `size` prop을 받고 `tintColor`로 색상을 제어한다. tabBarIcon 콜백은 `{ color, focused }` 파라미터를 받으므로 이를 활용해 선택/비선택 상태를 구분한다.

뒤로가기는 현재 `headerBackTitle`로 텍스트를 지정하는 것으로 충분하다. `headerBackButtonDisplayMode`를 명시적으로 설정하면 더 예측 가능한 동작을 확보할 수 있다.

## Implementation Landscape

### Key Files

- `mobile/app/(tabs)/_layout.tsx` — **핵심 변경 파일.** `Tabs.Screen` 2개에 `tabBarIcon` 추가. `expo-symbols`의 `SymbolView` import. 주제 탭에는 `pencil.and.list.clipboard`(또는 `list.bullet`), 이력 탭에는 `clock.arrow.circlepath`(또는 `calendar`) 심볼 사용.
- `mobile/app/_layout.tsx` — `Stack.Screen` 옵션 조정. 현재 `headerBackTitle`이 이미 설정되어 있으므로 실질적 변경은 최소. 필요 시 `headerBackButtonDisplayMode` 추가.

### expo-symbols SymbolView 사용 패턴

```tsx
import { SymbolView } from 'expo-symbols';

// tabBarIcon 콜백에서:
tabBarIcon: ({ color, focused }) => (
  <SymbolView
    name={{ ios: 'pencil.and.list.clipboard', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
    size={24}
    tintColor={color}
    weight={focused ? 'semibold' : 'regular'}
  />
)
```

`SymbolView`의 `size` prop은 숫자로 아이콘 크기를 제어한다. `tintColor`로 탭 바 활성/비활성 색상(`tabBarActiveTintColor` / `tabBarInactiveTintColor`)을 전달받는다.

### 적합한 심볼 이름

- **주제 탭 (쓰기 주제):** iOS `list.bullet` / Android `format_list_bulleted`
- **이력 탭 (제출 이력):** iOS `clock.arrow.circlepath` / Android `history`

### Build Order

1. `(tabs)/_layout.tsx`에 `tabBarIcon` 추가 (expo-symbols 사용) — 탭 아이콘 즉시 시각적 확인 가능
2. `_layout.tsx` Stack.Screen 헤더 옵션 정비 — `headerBackButtonDisplayMode: 'default'` 명시 또는 현행 유지 확인

### Verification Approach

- `cd mobile && npx tsc --noEmit` — 타입 에러 없음 확인
- Expo Go 또는 시뮬레이터에서 탭 바에 아이콘이 표시되는지 확인
- 주제 상세 → 뒤로가기 버튼이 표시되고 정상 동작하는지 확인

## Constraints

- `expo-symbols`는 이미 설치됨 — 추가 npm install 불필요
- `SymbolView`의 `name`을 플랫폼 객체 형태(`{ ios, android, web }`)로 전달해야 크로스 플랫폼 지원
- `@expo/vector-icons`가 없으므로 `Ionicons`/`MaterialIcons` 직접 사용 불가 — expo-symbols로 통일
