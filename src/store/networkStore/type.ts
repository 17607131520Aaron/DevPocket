import type { INetworkRequest } from "@/pages/Netword/type";

/**
 * 网络监控 Store 状态接口
 */
export interface INetworkStore {
  // 状态
  port: number;
  isConnecting: boolean;
  isConnected: boolean;
  requests: INetworkRequest[];
  selectedRequest: INetworkRequest | null;
  isRecording: boolean;
  shouldConnect: boolean;
  connectRequestId: number;

  // Actions
  setPort: (port: number) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setRequests: (requests: INetworkRequest[]) => void;
  addRequest: (request: INetworkRequest) => void;
  updateRequest: (id: string, updates: Partial<INetworkRequest>) => void;
  setSelectedRequest: (request: INetworkRequest | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setShouldConnect: (shouldConnect: boolean) => void;
  incrementConnectRequestId: () => void;
  clearRequests: () => void;
  reset: () => void;
}
