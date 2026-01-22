import type { ISetupHandlersParams } from "./type";

import type { Socket } from "socket.io-client";

/** Socket 实例缓存，实现连接复用 */
export const socketCache = new Map<string, { refCount: number; socket: Socket }>();

export function setupWebSocketHandlers(params: ISetupHandlersParams): void {
  const {
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
  } = params;

  ws.onopen = (event: Event) => {
    clearTimeoutTimer();
    updateConnectionState("connected");
    setError(null);
    reconnectAttemptsRef.current = 0;
    startHeartbeat();
    flushMessageQueue();
    callbacksRef.current.onOpen?.(event);
  };

  ws.onmessage = (event: MessageEvent) => {
    setLastMessage(event);
    let parsedEvent = event;
    if (parseJSON && typeof event.data === "string") {
      try {
        const parsed = JSON.parse(event.data);
        parsedEvent = new MessageEvent(event.type, {
          data: parsed,
          origin: event.origin,
          lastEventId: event.lastEventId,
          source: event.source,
          ports: event.ports.length > 0 ? [...event.ports] : undefined,
        });
      } catch {
        // 解析失败，使用原始事件
      }
    }
    const messageHandlers = messageHandlersRef.current.get("message");
    if (messageHandlers) {
      messageHandlers.forEach((handler) => {
        try {
          handler(parsedEvent);
        } catch (err) {
          console.error("[useWebSocket] Error in message handler:", err);
        }
      });
    }
    callbacksRef.current.onMessage?.(parsedEvent);
  };

  ws.onerror = (event: Event) => {
    clearTimeoutTimer();
    setError(new Error("WebSocket connection error"));
    updateConnectionState("error");
    callbacksRef.current.onError?.(event);
    if (immediateReconnect && shouldReconnectRef.current && !isManualDisconnectRef.current) {
      if (reconnectAttempts === Infinity || reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        setTimeout(() => createWebSocket(), getReconnectDelay());
      }
    }
  };

  ws.onclose = (event: CloseEvent) => {
    clearTimeoutTimer();
    stopHeartbeat();
    updateConnectionState("disconnected");
    webSocketRef.current = null;
    setWebSocket(null);
    callbacksRef.current.onClose?.(event);
    if (shouldReconnectRef.current && !isManualDisconnectRef.current && event.code !== 1000 && event.code !== 1001) {
      if (reconnectAttempts === Infinity || reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => createWebSocket(), getReconnectDelay());
      } else {
        setError(new Error("Max reconnection attempts reached"));
      }
    }
  };
}
