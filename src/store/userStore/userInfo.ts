import { createPersistStore } from "@/store";

import type { IUserInfoStore } from "./type";

/**
 * 用户信息 Store
 * 命名空间：user/info
 * 持久化：是
 */
export const useUserInfoStore = createPersistStore<IUserInfoStore>("user/info", (set) => ({
  // 初始状态
  user: null,

  // Actions
  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    set({ user: null });
  },

  updateUser: (user) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : user,
    }));
  },
}));
