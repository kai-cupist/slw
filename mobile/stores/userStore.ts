import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

const USER_ID_KEY = '@slw/user_id';

export interface UserState {
  /** 고유 사용자 식별자 (UUID v4) */
  userId: string | null;
  /** AsyncStorage에서 userId 로드 완료 여부 */
  isLoaded: boolean;
  /** AsyncStorage에서 userId를 로드한다. 없으면 새로 생성하여 저장한다. */
  loadUserId: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  isLoaded: false,

  loadUserId: async () => {
    // 이미 로드 완료면 스킵
    if (get().isLoaded) return;

    try {
      let userId = await AsyncStorage.getItem(USER_ID_KEY);

      if (!userId) {
        userId = Crypto.randomUUID();
        await AsyncStorage.setItem(USER_ID_KEY, userId);
      }

      set({ userId, isLoaded: true });
    } catch (error) {
      // AsyncStorage 실패 시에도 인메모리 UUID로 동작하도록 폴백
      console.error(
        '[userStore] AsyncStorage 접근 실패, 인메모리 UUID 사용:',
        error,
      );
      set({ userId: Crypto.randomUUID(), isLoaded: true });
    }
  },
}));
