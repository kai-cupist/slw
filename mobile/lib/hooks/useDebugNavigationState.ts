import { useNavigationContainerRef } from 'expo-router';
import { useEffect, useRef } from 'react';

function formatNavTree(state: any, prefix = '', isRoot = true): string {
  if (!state) return '';
  let result = '';
  const routes = state.routes ?? [];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const isFocused = i === state.index;
    const isLastRoute = i === routes.length - 1;

    const connector = isRoot ? '' : isLastRoute ? '└─ ' : '├─ ';
    const focusTag = isFocused ? ' *' : '';

    const childState = route.state;
    const isStack = childState?.type === 'stack';
    const stackCount = isStack ? childState.routes.length : 0;
    const countTag = stackCount > 0 ? ` [stack:${stackCount}]` : '';
    let line = `${prefix}${connector}${route.name}${countTag}`;

    if (route.params) {
      const paramKeys = Object.keys(route.params).filter(
        (k) => k !== 'screen' && k !== 'params',
      );
      if (paramKeys.length > 0) {
        const paramStr = paramKeys
          .map((k) => `${k}=${JSON.stringify(route.params[k])}`)
          .join(', ');
        line += ` (${paramStr})`;
      }
    }

    line += focusTag;
    result += line + '\n';

    if (route.state) {
      const childPrefix = isRoot
        ? prefix
        : `${prefix}${isLastRoute ? '   ' : '│  '}`;
      result += formatNavTree(route.state, childPrefix, false);
    }
  }
  return result;
}

export function useDebugNavigationState() {
  const navigationRef = useNavigationContainerRef();
  const prevTreeRef = useRef('');

  useEffect(() => {
    if (!__DEV__) return;

    const unsubscribe = navigationRef.addListener('state', () => {
      const rootState = navigationRef.getRootState();
      const tree = formatNavTree(rootState);

      if (tree === prevTreeRef.current) return;
      prevTreeRef.current = tree;

      console.log('\n\n[NAV TREE]\n' + tree);
    });
    return unsubscribe;
  }, [navigationRef]);
}
