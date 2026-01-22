import type { IJsLogItem } from "@/pages/DebugLogs/type";

/**
 * 调试日志 Store 状态接口
 */
export interface IDebugLogsStore {
  // 状态
  port: number;
  isConnecting: boolean;
  isConnected: boolean;
  logs: IJsLogItem[];
  levelFilter: string;
  searchText: string;
  shouldConnect: boolean;
  connectRequestId: number;

  // Actions
  setPort: (port: number) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setLogs: (logs: IJsLogItem[]) => void;
  addLog: (log: IJsLogItem) => void;
  setLevelFilter: (levelFilter: string) => void;
  setSearchText: (searchText: string) => void;
  setShouldConnect: (shouldConnect: boolean) => void;
  incrementConnectRequestId: () => void;
  clearLogs: () => void;
  reset: () => void;
}
