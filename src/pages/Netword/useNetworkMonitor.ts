/**
 * 网络请求监控 Hook
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { useWebSocket } from "@/hooks/useSocket";
import { useNetworkStore } from "@/store";

import { DEFAULT_MAX_REQUESTS, DEFAULT_RECONNECT_DELAY } from "./constants";

import type { INetworkRequest, INetworkMessage } from "./type";

const useNetworkMonitor = (): {
  port: number;
  setPort: React.Dispatch<React.SetStateAction<number>>;
  isConnecting: boolean;
  isConnected: boolean;
  requests: INetworkRequest[];
  selectedRequest: INetworkRequest | null;
  setSelectedRequest: React.Dispatch<React.SetStateAction<INetworkRequest | null>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  filteredRequests: INetworkRequest[];
  handleConnectClick: () => void;
  handleClearRequests: () => void;
  handleClose: () => void;
} => {
  // 从 store 读取状态
  const {
    port,
    isConnecting,
    isConnected,
    requests,
    selectedRequest,
    isRecording,
    shouldConnect,
    connectRequestId,
    setPort: setPortStore,
    setIsConnecting,
    setIsConnected,
    addRequest,
    updateRequest,
    setSelectedRequest: setSelectedRequestStore,
    setIsRecording: setIsRecordingStore,
    setShouldConnect,
    incrementConnectRequestId,
    clearRequests,
  } = useNetworkStore();

  // 构建 WebSocket URL
  // 使用 /logs 端点，与日志服务器共享连接
  const wsUrl = useMemo(() => {
    if (!shouldConnect) {
      return "";
    }
    const wsHost = "localhost";
    return `ws://${wsHost}:${port}/logs`;
  }, [port, shouldConnect]);

  // 请求映射，用于更新响应
  const requestsMapRef = useRef<Map<string, INetworkRequest>>(new Map());

  // 处理网络请求消息
  const handleNetworkMessage = useCallback(
    (event: MessageEvent) => {
      if (!isRecording) {
        return;
      }

      try {
        const data = typeof event.data === "string" ? event.data : String(event.data);
        const message = JSON.parse(data);

        // 忽略系统消息（如欢迎消息）
        if (message.type === "system") {
          console.log("[NetworkMonitor] 收到系统消息:", message.message);
          return;
        }

        // 类型断言为网络消息
        const networkMessage = message as INetworkMessage;

        if (networkMessage.type === "network-request") {
          // 提取所有数据，包括额外的配置信息
          const requestData = networkMessage.data as Record<string, unknown>;
          const request: INetworkRequest = {
            id: requestData["id"] as string,
            method: requestData["method"] as string,
            url: requestData["url"] as string,
            headers: (requestData["headers"] as Record<string, string>) || {},
            data: requestData["data"],
            startTime: requestData["startTime"] as number,
            type: (requestData["type"] as string) || "xhr",
            completed: false,
            baseURL: requestData["baseURL"] as string | undefined,
            originalUrl: requestData["originalUrl"] as string | undefined,
            params: requestData["params"],
            body: requestData["body"],
            requestSize: requestData["requestSize"] as number | undefined,
            // 注意：额外的配置信息（如 credentials, mode, cache, withCredentials, timeout, responseType 等）
            // 会被保留在 request 对象中，但类型定义中可能没有这些字段
            // 如果需要在前端使用这些字段，可以扩展 INetworkRequest 类型定义
          };

          // 限制最大请求数量（在添加前检查）
          const currentRequests = useNetworkStore.getState().requests;
          if (currentRequests.length >= DEFAULT_MAX_REQUESTS) {
            // 移除最旧的请求
            const newRequests = currentRequests.slice(1);
            useNetworkStore.getState().setRequests(newRequests);
          }

          addRequest(request);
          requestsMapRef.current.set(request.id, request);
        } else if (networkMessage.type === "network-response") {
          const currentRequests = useNetworkStore.getState().requests;
          const req = currentRequests.find((r) => r.id === networkMessage.data.id);
          if (req) {
            updateRequest(networkMessage.data.id, {
              status: networkMessage.data.status,
              responseHeaders: networkMessage.data.headers || {},
              responseData: networkMessage.data.data,
              endTime: networkMessage.data.endTime,
              duration: networkMessage.data.endTime - req.startTime,
              responseSize: networkMessage.data.size,
              completed: true,
            });
            const updated = { ...req, ...networkMessage.data };
            requestsMapRef.current.set(req.id, updated as INetworkRequest);
          }
        } else if (networkMessage.type === "network-error") {
          const currentRequests = useNetworkStore.getState().requests;
          const req = currentRequests.find((r) => r.id === networkMessage.data.id);
          if (req) {
            updateRequest(networkMessage.data.id, {
              error: networkMessage.data.error,
              endTime: networkMessage.data.endTime,
              duration: networkMessage.data.endTime - req.startTime,
              completed: true,
            });
            const updated = { ...req, error: networkMessage.data.error, endTime: networkMessage.data.endTime };
            requestsMapRef.current.set(req.id, updated as INetworkRequest);
          }
        } else {
          // 未知消息类型，记录但不处理
          console.warn("[NetworkMonitor] 收到未知类型的消息:", message.type);
        }
      } catch (error) {
        console.error("[NetworkMonitor] Failed to parse message:", error);
      }
    },
    [isRecording, addRequest, updateRequest],
  );

  // 使用 WebSocket hook
  const { isConnected: wsConnected, isConnecting: wsConnecting, connect, disconnect } = useWebSocket({
    url: wsUrl,
    autoConnect: false,
    reconnect: true,
    reconnectInterval: DEFAULT_RECONNECT_DELAY,
    parseJSON: false,
    onMessage: handleNetworkMessage,
    onOpen: () => {
      setIsConnected(true);
      setIsConnecting(false);
    },
    onClose: () => {
      setIsConnected(false);
      setIsConnecting(false);
    },
    onError: () => {
      setIsConnecting(false);
    },
  });

  // 同步 WebSocket 状态到 store
  useEffect(() => {
    setIsConnected(wsConnected);
    setIsConnecting(wsConnecting);
  }, [wsConnected, wsConnecting, setIsConnected, setIsConnecting]);

  // 连接/重连
  const handleConnectClick = useCallback(() => {
    if (isConnected) {
      // 重连
      disconnect();
      setTimeout(() => {
        incrementConnectRequestId();
        setShouldConnect(true);
      }, 100);
    } else {
      setShouldConnect(true);
      incrementConnectRequestId();
    }
  }, [isConnected, disconnect, incrementConnectRequestId, setShouldConnect]);

  // 关闭连接
  const handleClose = useCallback(() => {
    setShouldConnect(false);
    disconnect();
  }, [disconnect, setShouldConnect]);

  // 清除所有请求
  const handleClearRequests = useCallback(() => {
    clearRequests();
    requestsMapRef.current.clear();
  }, [clearRequests]);

  // 过滤请求（可以根据需要添加更多过滤条件）
  const filteredRequests = useMemo(() => {
    return requests;
  }, [requests]);

  // 当 shouldConnect 变化时连接
  useEffect(() => {
    if (shouldConnect && wsUrl) {
      setIsConnecting(true);
      connect();
    }
  }, [shouldConnect, wsUrl, connectRequestId, connect, setIsConnecting]);

  // setPort 包装函数，支持直接设置值或使用函数
  const setPortWrapper = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (typeof value === "function") {
        const currentPort = useNetworkStore.getState().port;
        setPortStore(value(currentPort));
      } else {
        setPortStore(value);
      }
    },
    [setPortStore],
  );

  // setSelectedRequest 包装函数
  const setSelectedRequestWrapper = useCallback(
    (value: INetworkRequest | null | ((prev: INetworkRequest | null) => INetworkRequest | null)) => {
      if (typeof value === "function") {
        const currentSelected = useNetworkStore.getState().selectedRequest;
        setSelectedRequestStore(value(currentSelected));
      } else {
        setSelectedRequestStore(value);
      }
    },
    [setSelectedRequestStore],
  );

  // setIsRecording 包装函数
  const setIsRecordingWrapper = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (typeof value === "function") {
        const currentRecording = useNetworkStore.getState().isRecording;
        setIsRecordingStore(value(currentRecording));
      } else {
        setIsRecordingStore(value);
      }
    },
    [setIsRecordingStore],
  );

  return {
    port,
    setPort: setPortWrapper,
    isConnecting,
    isConnected,
    requests,
    selectedRequest,
    setSelectedRequest: setSelectedRequestWrapper,
    isRecording,
    setIsRecording: setIsRecordingWrapper,
    filteredRequests,
    handleConnectClick,
    handleClearRequests,
    handleClose,
  };
};

export default useNetworkMonitor;
