/**
 * Server-Sent Events（SSE） Hook
 * - 适合只需要服务端推送、无需客户端主动 emit 的场景
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { ConnectionState, IUseSSEOptions, IUseSSEReturn } from "./type";

export function useSSE(options: IUseSSEOptions): IUseSSEReturn {
  const { url, autoConnect = true, withCredentials } = options;

  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const createEventSource = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    // 已存在则直接返回
    if (eventSourceRef.current) {
      return eventSourceRef.current;
    }

    const es = new EventSource(url, { withCredentials });
    eventSourceRef.current = es;
    setEventSource(es);

    setConnectionState("connecting");

    const handleOpen = (): void => {
      setConnectionState("connected");
      setError(null);
    };

    const handleError = (): void => {
      // EventSource 会自动重连，这里只标记为 error/connecting
      const err = new Error("SSE connection error");
      setError(err);

      // readyState: 0-connecting, 1-open, 2-closed
      if (es.readyState === EventSource.CLOSED) {
        setConnectionState("error");
      } else {
        setConnectionState("connecting");
      }
    };

    es.addEventListener("open", handleOpen);
    es.addEventListener("error", handleError);

    // 在实例上挂一个清理函数，方便统一清理
    (es as EventSource & { __cleanup__?: () => void }).__cleanup__ = () => {
      es.removeEventListener("open", handleOpen);
      es.removeEventListener("error", handleError);
      es.close();
    };

    return es;
  }, [url, withCredentials]);

  // 初始化/自动连接
  useEffect(() => {
    if (autoConnect) {
      createEventSource();
    }

    return () => {
      const es = eventSourceRef.current as (EventSource & { __cleanup__?: () => void }) | null;
      if (es) {
        es.__cleanup__?.();
      }
      eventSourceRef.current = null;
      setEventSource(null);
      setConnectionState("disconnected");
    };
  }, [autoConnect, createEventSource]);

  // 手动连接
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      // 已存在则不重复创建
      return;
    }
    createEventSource();
  }, [createEventSource]);

  // 手动断开
  const disconnect = useCallback(() => {
    const es = eventSourceRef.current as (EventSource & { __cleanup__?: () => void }) | null;
    if (es) {
      es.__cleanup__?.();
      eventSourceRef.current = null;
      setEventSource(null);
      setConnectionState("disconnected");
    }
  }, []);

  // no-op 函数，用于当 EventSource 不存在时返回
  const noop = useCallback((): void => {
    // No operation - EventSource not available
  }, []);

  // 监听事件
  const on = useCallback(
    (event: string, callback: (event: MessageEvent) => void) => {
      const es = eventSourceRef.current;
      if (!es) {
        return noop;
      }
      es.addEventListener(event, callback as EventListener);
      return () => {
        es.removeEventListener(event, callback as EventListener);
      };
    },
    [noop],
  );

  return {
    eventSource,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    error,
    connectionState,
    connect,
    disconnect,
    on,
  };
}
