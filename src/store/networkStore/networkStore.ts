import { DEFAULT_PORT } from "@/pages/Netword/constants";
import { createPersistStore } from "@/store";

import type { INetworkStore } from "./type";

/**
 * 网络监控 Store
 * 命名空间：monitor/network
 * 持久化：是（保存端口和连接状态）
 */
export const useNetworkStore = createPersistStore<INetworkStore>("monitor/network", (set) => ({
  // 初始状态
  port: DEFAULT_PORT,
  isConnecting: false,
  isConnected: false,
  requests: [],
  selectedRequest: null,
  isRecording: true,
  shouldConnect: false,
  connectRequestId: 0,

  // Actions
  setPort: (port) => set({ port }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setRequests: (requests) => set({ requests }),
  addRequest: (request) =>
    set((state) => {
      const next = [...state.requests, request];
      // 限制最大请求数量（在 hook 中处理）
      return { requests: next };
    }),
  updateRequest: (id, updates) =>
    set((state) => ({
      requests: state.requests.map((req) => (req.id === id ? { ...req, ...updates } : req)),
    })),
  setSelectedRequest: (selectedRequest) => set({ selectedRequest }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setShouldConnect: (shouldConnect) => set({ shouldConnect }),
  incrementConnectRequestId: () => set((state) => ({ connectRequestId: state.connectRequestId + 1 })),
  clearRequests: () => set({ requests: [], selectedRequest: null }),
  reset: () =>
    set({
      port: DEFAULT_PORT,
      isConnecting: false,
      isConnected: false,
      requests: [],
      selectedRequest: null,
      isRecording: true,
      shouldConnect: false,
      connectRequestId: 0,
    }),
}));
