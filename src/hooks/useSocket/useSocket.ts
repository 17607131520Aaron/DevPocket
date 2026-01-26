/**
 * 通用 Socket Hook
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { io } from "socket.io-client";

import { socketCache } from "./utils";

import type {
  ConnectionState,
  IEmitResult,
  ISocketConfigForIO,
  IUseSocketOptions,
  IUseSocketReturn,
} from "./type";
import type { Socket } from "socket.io-client";

export const useSocket = (options: IUseSocketOptions): IUseSocketReturn => {
  const { url, autoConnect = true, ...socketOptions } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // 初始化 Socket
  useEffect(() => {
    // 检查缓存
    let cached = socketCache.get(url);

    if (cached) {
      cached.refCount += 1;
      socketRef.current = cached.socket;
    } else {
      // 创建新连接（使用 ISocketConfigForIO 允许可选为 undefined，兼容 exactOptionalPropertyTypes）
      const socketConfig: ISocketConfigForIO = {
        autoConnect: false,
        auth: socketOptions.auth,
        extraHeaders: socketOptions.extraHeaders,
        path: socketOptions.path,
        query: socketOptions.query,
        reconnection: socketOptions.reconnection ?? true,
        reconnectionAttempts: socketOptions.reconnectionAttempts ?? 3,
        reconnectionDelay: socketOptions.reconnectionDelay ?? 1000,
        timeout: socketOptions.timeout ?? 20000,
      };
      const newSocket = io(url, socketConfig as Parameters<typeof io>[1]);

      socketCache.set(url, { socket: newSocket, refCount: 1 });
      socketRef.current = newSocket;
      cached = socketCache.get(url);
    }

    // 使用 ref 而不是 state 来避免在 effect 中同步调用 setState
    const currentSocket = cached?.socket;
    if (currentSocket) {
      // 延迟设置 socket state，避免同步 setState
      setTimeout((): void => {
        setSocket(currentSocket);
      }, 0);
    }

    if (!currentSocket) {
      return;
    }

    // 事件处理
    const handleConnect = (): void => {
      setConnectionState("connected");
      setError(null);
    };

    const handleDisconnect = (): void => {
      setConnectionState("disconnected");
    };

    const handleConnectError = (err: Error): void => {
      setConnectionState("error");
      setError(err);
    };

    const handleReconnectAttempt = (): void => {
      setConnectionState("connecting");
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);
    currentSocket.io.on("reconnect_attempt", handleReconnectAttempt);

    // 检查当前状态或自动连接
    if (currentSocket.connected) {
      // 延迟设置状态
      setTimeout((): void => {
        setConnectionState("connected");
      }, 0);
    } else if (autoConnect) {
      setTimeout((): void => {
        setConnectionState("connecting");
      }, 0);
      currentSocket.connect();
    }

    // 清理
    return (): void => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.io.off("reconnect_attempt", handleReconnectAttempt);

      const cache = socketCache.get(url);
      if (cache) {
        cache.refCount -= 1;
        if (cache.refCount <= 0) {
          cache.socket.disconnect();
          socketCache.delete(url);
        }
      }
    };
  }, [
    url,
    autoConnect,
    socketOptions.path,
    socketOptions.reconnection,
    socketOptions.reconnectionAttempts,
    socketOptions.reconnectionDelay,
    socketOptions.timeout,
    socketOptions.auth,
    socketOptions.query,
    socketOptions.extraHeaders,
  ]);

  // 手动连接
  const connect = useCallback((): void => {
    if (socketRef.current && !socketRef.current.connected) {
      setConnectionState("connecting");
      socketRef.current.connect();
    }
  }, []);

  // 手动断开
  const disconnect = useCallback((): void => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  // 监听事件
  const on = useCallback(<T = unknown>(event: string, callback: (data: T) => void): (() => void) => {
    if (!socketRef.current) {
      return (): void => {
        // No operation - socket not available
      };
    }
    socketRef.current.on(event, callback as (...args: unknown[]) => void);
    return (): void => {
      socketRef.current?.off(event, callback as (...args: unknown[]) => void);
    };
  }, []);

  // 取消监听
  const off = useCallback((event: string, callback?: (...args: unknown[]) => void): void => {
    if (!socketRef.current) {
      return;
    }
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  }, []);

  // 发送消息
  const emit = useCallback((event: string, data?: unknown): void => {
    if (!socketRef.current?.connected) {
      console.warn(`[useSocket] Cannot emit "${event}": Socket not connected`);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  // 发送消息（带确认）
  const emitWithAck = <T = unknown>(event: string, data?: unknown, timeout = 5000): Promise<IEmitResult<T>> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ error: "Socket not connected", success: false });
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve({ error: `Timeout after ${timeout}ms`, success: false });
      }, timeout);

      socketRef.current.emit(event, data, (response: T) => {
        clearTimeout(timeoutId);
        resolve({ data: response, success: true });
      });
    });
  };

  return {
    socket,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    error,
    connectionState,
    connect,
    disconnect,
    on,
    off,
    emit,
    emitWithAck,
  };
};
