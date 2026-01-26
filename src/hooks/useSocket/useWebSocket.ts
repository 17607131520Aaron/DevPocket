/**
 * 原生 WebSocket Hook
 * - 适用于原生 WebSocket 协议（非 Socket.IO）
 * - 支持自动重连、消息监听、心跳检测等功能
 * - 通用且可配置的 WebSocket 连接管理
 * - 支持 URL 动态变化、消息队列、指数退避重连等高级特性
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { setupWebSocketHandlers } from "./utils";

import type { ConnectionState, IUseWebSocketOptions, IUseWebSocketReturn } from "./type";

export const useWebSocket = (options: IUseWebSocketOptions): IUseWebSocketReturn => {
  const {
    url: urlOption,
    autoConnect = false,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = Infinity,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    onStateChange,
    parseJSON = false,
    heartbeatInterval = 0,
    heartbeatMessage = "ping",
    timeout = 0,
    immediateReconnect = false,
  } = options;

  // 使用 ref 存储回调函数，避免依赖变化导致重连
  const callbacksRef = useRef({
    onOpen,
    onClose,
    onError,
    onMessage,
    onStateChange,
  });

  // 更新回调函数引用
  useEffect(() => {
    callbacksRef.current = {
      onOpen,
      onClose,
      onError,
      onMessage,
      onStateChange,
    };
  }, [onOpen, onClose, onError, onMessage, onStateChange]);

  // 获取 URL（支持函数形式）
  const getUrl = useCallback(() => {
    return typeof urlOption === "function" ? urlOption() : urlOption;
  }, [urlOption]);

  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const timeoutTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(reconnect);
  const messageHandlersRef = useRef<Map<string, Set<(event: MessageEvent) => void>>>(new Map());
  const isManualDisconnectRef = useRef(false);
  const currentUrlRef = useRef<string>("");
  const messageQueueRef = useRef<Array<string | ArrayBuffer | Blob>>([]);

  // 更新连接状态
  const updateConnectionState = useCallback((newState: ConnectionState) => {
    setConnectionState((prevState) => {
      if (prevState !== newState) {
        callbacksRef.current.onStateChange?.(newState);
        return newState;
      }
      return prevState;
    });
  }, []);

  // 清理重连定时器
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // 清理超时定时器
  const clearTimeoutTimer = useCallback(() => {
    if (timeoutTimerRef.current) {
      window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  // 清理心跳定时器
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // 清理所有定时器
  const clearAllTimers = useCallback(() => {
    clearReconnectTimer();
    clearTimeoutTimer();
    stopHeartbeat();
  }, [clearReconnectTimer, clearTimeoutTimer, stopHeartbeat]);

  // 启动心跳
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval <= 0) {
      return;
    }

    stopHeartbeat();

    heartbeatTimerRef.current = window.setInterval(() => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          webSocketRef.current.send(heartbeatMessage);
        } catch (err) {
          console.error("[useWebSocket] Failed to send heartbeat:", err);
        }
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, heartbeatMessage, stopHeartbeat]);

  // 发送队列中的消息
  const flushMessageQueue = useCallback(() => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift();
        if (message) {
          try {
            webSocketRef.current.send(message);
          } catch (err) {
            console.error("[useWebSocket] Failed to send queued message:", err);
          }
        }
      }
    }
  }, []);

  // 计算重连延迟（指数退避）
  const getReconnectDelay = useCallback(() => {
    if (reconnectAttemptsRef.current === 0) {
      return reconnectInterval;
    }
    // 指数退避：每次重连延迟翻倍，最大不超过 30 秒
    return Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
  }, [reconnectInterval]);

  // 创建 WebSocket 连接
  const createWebSocket = useCallback(() => {
    const url = getUrl();

    if (typeof window === "undefined" || !url || url.trim() === "") {
      return null;
    }

    // 如果 URL 没有变化且已连接，不重新创建
    if (currentUrlRef.current === url && webSocketRef.current?.readyState === WebSocket.OPEN) {
      return webSocketRef.current;
    }

    // 验证 URL 格式
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      const error = new Error(`Invalid WebSocket URL: ${url}. Must start with ws:// or wss://`);
      setError(error);
      updateConnectionState("error");
      return null;
    }

    // 如果已存在连接，先关闭
    if (webSocketRef.current) {
      const oldWs = webSocketRef.current;
      // 移除事件监听器，避免内存泄漏
      oldWs.onopen = null;
      oldWs.onclose = null;
      oldWs.onerror = null;
      oldWs.onmessage = null;
      oldWs.close();
      webSocketRef.current = null;
    }

    currentUrlRef.current = url;

    try {
      const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
      webSocketRef.current = ws;
      setWebSocket(ws);
      updateConnectionState("connecting");
      setError(null);

      // 设置连接超时
      if (timeout > 0) {
        clearTimeoutTimer();
        timeoutTimerRef.current = window.setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            const timeoutError = new Error(`WebSocket connection timeout after ${timeout}ms`);
            setError(timeoutError);
            updateConnectionState("error");
          }
        }, timeout);
      }

      // 设置事件处理器
      setupWebSocketHandlers({
        ws,
        parseJSON,
        clearTimeoutTimer,
        stopHeartbeat,
        updateConnectionState,
        setError,
        setLastMessage,
        startHeartbeat,
        flushMessageQueue,
        getReconnectDelay,
        clearReconnectTimer,
        immediateReconnect,
        reconnectAttempts,
        createWebSocket,
        callbacksRef,
        messageHandlersRef,
        reconnectAttemptsRef,
        shouldReconnectRef,
        isManualDisconnectRef,
        webSocketRef,
        setWebSocket,
        reconnectTimerRef,
      });

      return ws;
    } catch (err) {
      clearAllTimers();
      const error = err instanceof Error ? err : new Error("Failed to create WebSocket");
      setError(error);
      updateConnectionState("error");
      return null;
    }
  }, [
    getUrl,
    protocols,
    timeout,
    parseJSON,
    immediateReconnect,
    reconnectAttempts,
    updateConnectionState,
    clearTimeoutTimer,
    clearReconnectTimer,
    clearAllTimers,
    startHeartbeat,
    stopHeartbeat,
    flushMessageQueue,
    getReconnectDelay,
  ]);

  // 手动断开（提前定义，供其他 useEffect 使用）
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    isManualDisconnectRef.current = true;
    clearAllTimers();
    if (webSocketRef.current) {
      const ws = webSocketRef.current;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close(1000, "Manual disconnect");
      webSocketRef.current = null;
      setWebSocket(null);
    }
    messageQueueRef.current = [];
    updateConnectionState("disconnected");
  }, [clearAllTimers, updateConnectionState]);

  // 监听 URL 变化，自动重新连接
  useEffect(() => {
    const url = getUrl();
    if (url && url !== currentUrlRef.current && webSocketRef.current) {
      // URL 变化，重新连接
      if (webSocketRef.current.readyState === WebSocket.OPEN) {
        disconnect();
      }
      if (autoConnect || shouldReconnectRef.current) {
        setTimeout(() => {
          createWebSocket();
        }, 0);
      }
    }
  }, [urlOption, autoConnect, getUrl, createWebSocket, disconnect]);

  // 初始化/自动连接
  useEffect(() => {
    if (autoConnect) {
      createWebSocket();
    }

    return () => {
      clearAllTimers();
      if (webSocketRef.current) {
        shouldReconnectRef.current = false;
        isManualDisconnectRef.current = true;
        const ws = webSocketRef.current;
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
        webSocketRef.current = null;
        setWebSocket(null);
      }
      messageQueueRef.current = [];
      updateConnectionState("disconnected");
    };
  }, [autoConnect, createWebSocket, clearAllTimers, updateConnectionState]);

  // 更新重连配置
  useEffect(() => {
    shouldReconnectRef.current = reconnect;
  }, [reconnect]);

  // 手动连接
  const connect = useCallback(() => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    shouldReconnectRef.current = reconnect;
    reconnectAttemptsRef.current = 0;
    isManualDisconnectRef.current = false;
    createWebSocket();
  }, [reconnect, createWebSocket]);

  // 监听消息
  const on = useCallback((event: string, callback: (event: MessageEvent) => void) => {
    if (!messageHandlersRef.current.has(event)) {
      messageHandlersRef.current.set(event, new Set());
    }
    const handlers = messageHandlersRef.current.get(event);
    if (handlers) {
      handlers.add(callback);
    }

    return () => {
      const handlers = messageHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(event);
        }
      }
    };
  }, []);

  // 取消监听
  const off = useCallback((event: string, callback?: (event: MessageEvent) => void) => {
    const handlers = messageHandlersRef.current.get(event);
    if (handlers) {
      if (callback) {
        handlers.delete(callback);
      } else {
        handlers.clear();
      }
      if (handlers.size === 0) {
        messageHandlersRef.current.delete(event);
      }
    }
  }, []);

  // 发送消息
  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      try {
        webSocketRef.current.send(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        console.error("[useWebSocket] Failed to send message:", err);
      }
    } else if (webSocketRef.current?.readyState === WebSocket.CONNECTING) {
      // 连接中，加入队列
      messageQueueRef.current.push(data);
    } else {
      const error = new Error("WebSocket is not connected");
      setError(error);
      console.warn("[useWebSocket] Cannot send: WebSocket not connected");
    }
  }, []);

  // 发送 JSON 消息
  const sendJSON = useCallback(
    <T = unknown>(data: T) => {
      try {
        const jsonString = JSON.stringify(data);
        send(jsonString);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to stringify JSON");
        setError(error);
        console.error("[useWebSocket] Failed to send JSON:", err);
      }
    },
    [send],
  );

  // 获取当前重连尝试次数
  const getReconnectAttempts = useCallback(() => {
    return reconnectAttemptsRef.current;
  }, []);

  // 重置重连计数器
  const resetReconnectAttempts = useCallback(() => {
    reconnectAttemptsRef.current = 0;
  }, []);

  return {
    webSocket,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    error,
    connectionState,
    lastMessage,
    connect,
    disconnect,
    on,
    off,
    send,
    sendJSON,
    getReconnectAttempts,
    resetReconnectAttempts,
  };
};
