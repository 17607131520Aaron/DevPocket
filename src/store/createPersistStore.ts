import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";

import { getStorageKey, shouldPersist } from "./config";

/**
 * 创建支持持久化的 Zustand Store
 * 只有配置名单中的命名空间才会被持久化
 *
 * @param namespace 命名空间，用于区分不同的 store（格式：模块名/功能名，例如：user/profile）
 * @param storeCreator Store 创建函数
 * @param options 可选的持久化配置选项
 * @returns Zustand Store 实例
 *
 * @example
 * ```ts
 * interface UserState {
 *   name: string;
 *   setName: (name: string) => void;
 * }
 *
 * const useUserStore = createPersistStore<UserState>(
 *   'user/profile',
 *   (set) => ({
 *     name: '',
 *     setName: (name) => set({ name }),
 *   })
 * );
 * ```
 */
export function createPersistStore<T extends object>(
  namespace: string,
  storeCreator: StateCreator<T>,
  options?: Omit<PersistOptions<T>, "name">,
): UseBoundStore<StoreApi<T>> {
  // 如果命名空间不在持久化名单中，直接返回基础 store
  if (!shouldPersist(namespace)) {
    return create<T>(storeCreator);
  }

  // 如果在持久化名单中，添加持久化中间件
  return create<T>()(
    persist(storeCreator, {
      name: getStorageKey(namespace),
      ...options,
    }),
  );
}
