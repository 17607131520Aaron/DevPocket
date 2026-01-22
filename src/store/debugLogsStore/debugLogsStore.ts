import { DEFAULT_PORT } from "@/pages/DebugLogs/constants";
import { createPersistStore } from "@/store";

import type { IDebugLogsStore } from "./type";

/**
 * 调试日志 Store
 * 命名空间：monitor/debugLogs
 * 持久化：是（保存端口和过滤条件）
 */
export const useDebugLogsStore = createPersistStore<IDebugLogsStore>("monitor/debugLogs", (set) => ({
  // 初始状态
  port: DEFAULT_PORT,
  isConnecting: false,
  isConnected: false,
  logs: [],
  levelFilter: "log", // 默认只显示 log 级别
  searchText: "",
  shouldConnect: false,
  connectRequestId: 0,

  // Actions
  setPort: (port) => set({ port }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setLogs: (logs) => set({ logs }),
  addLog: (log) =>
    set((state) => {
      const next = [...state.logs, log];
      // 限制最大日志数量（在 hook 中处理）
      return { logs: next };
    }),
  setLevelFilter: (levelFilter) => set({ levelFilter }),
  setSearchText: (searchText) => set({ searchText }),
  setShouldConnect: (shouldConnect) => set({ shouldConnect }),
  incrementConnectRequestId: () => set((state) => ({ connectRequestId: state.connectRequestId + 1 })),
  clearLogs: () => set({ logs: [] }),
  reset: () =>
    set({
      port: DEFAULT_PORT,
      isConnecting: false,
      isConnected: false,
      logs: [],
      levelFilter: "log",
      searchText: "",
      shouldConnect: false,
      connectRequestId: 0,
    }),
}));
