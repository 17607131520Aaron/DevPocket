import type { Socket } from "socket.io-client";

/** 连接状态 */
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

/** Socket 配置选项 */
export interface IUseSocketOptions {
  /** 服务器 URL */
  url: string;
  /** Socket.io 路径 */
  path?: string;
  /** 是否自动连接，默认 true */
  autoConnect?: boolean;
  /** 是否启用重连，默认 true */
  reconnection?: boolean;
  /** 重连尝试次数，默认 3 */
  reconnectionAttempts?: number;
  /** 重连延迟（毫秒），默认 1000 */
  reconnectionDelay?: number;
  /** 连接超时（毫秒），默认 20000 */
  timeout?: number;
  /** 认证信息 */
  auth?: Record<string, unknown>;
  /** 查询参数 */
  query?: Record<string, string>;
  /** 额外请求头 */
  extraHeaders?: Record<string, string>;
}

/** Emit 结果 */
export interface IEmitResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** SSE 配置选项 */
export interface IUseSSEOptions {
  /** 服务器 URL（完整 SSE 地址，包含 query 等） */
  url: string;
  /** 是否自动连接，默认 true */
  autoConnect?: boolean;
  /**
   * 是否携带跨域凭证
   * 对应 EventSource.withCredentials
   */
  withCredentials?: boolean;
}

/** useSSE 返回值 */
export interface IUseSSEReturn {
  /** EventSource 实例 */
  eventSource: EventSource | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开 */
  disconnect: () => void;
  /**
   * 监听 SSE 事件
   * - 默认事件：`message`
   * - 自定义事件：服务端通过 `event: xxx` 推送
   */
  on: (event: string, callback: (event: MessageEvent) => void) => () => void;
}

/** useSocket 返回值 */
export interface IUseSocketReturn {
  /** Socket 实例 */
  socket: Socket | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开 */
  disconnect: () => void;
  /** 监听事件 */
  on: <T = unknown>(event: string, callback: (data: T) => void) => () => void;
  /** 取消监听 */
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
  /** 发送消息 */
  emit: (event: string, data?: unknown) => void;
  /** 发送消息（带确认） */
  emitWithAck: <T = unknown>(event: string, data?: unknown, timeout?: number) => Promise<IEmitResult<T>>;
}

/** WebSocket 配置选项 */
export interface IUseWebSocketOptions {
  /** WebSocket 服务器 URL（ws:// 或 wss://） */
  url: string | (() => string);
  /** 是否自动连接，默认 false */
  autoConnect?: boolean;
  /** 是否启用自动重连，默认 true */
  reconnect?: boolean;
  /** 重连间隔（毫秒），默认 3000 */
  reconnectInterval?: number;
  /** 最大重连次数，默认 Infinity */
  reconnectAttempts?: number;
  /** WebSocket 子协议（可选） */
  protocols?: string | string[];
  /** 连接打开时的回调 */
  onOpen?: (event: Event) => void;
  /** 连接关闭时的回调 */
  onClose?: (event: CloseEvent) => void;
  /** 连接错误时的回调 */
  onError?: (event: Event) => void;
  /** 收到消息时的回调 */
  onMessage?: (event: MessageEvent) => void;
  /** 连接状态变化时的回调 */
  onStateChange?: (state: ConnectionState) => void;
  /** 是否自动解析 JSON 消息，默认 false */
  parseJSON?: boolean;
  /** 心跳间隔（毫秒），0 表示不启用，默认 0 */
  heartbeatInterval?: number;
  /** 心跳消息内容，默认 "ping" */
  heartbeatMessage?: string | ArrayBuffer | Blob;
  /** 连接超时（毫秒），默认 0（不超时） */
  timeout?: number;
  /** 是否在连接失败时立即重试，默认 false */
  immediateReconnect?: boolean;
}

/** useWebSocket 返回值 */
export interface IUseWebSocketReturn {
  /** WebSocket 实例 */
  webSocket: WebSocket | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 最后收到的消息 */
  lastMessage: MessageEvent | null;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开 */
  disconnect: () => void;
  /** 监听消息事件 */
  on: (event: string, callback: (event: MessageEvent) => void) => () => void;
  /** 取消监听 */
  off: (event: string, callback?: (event: MessageEvent) => void) => void;
  /** 发送消息 */
  send: (data: string | ArrayBuffer | Blob) => void;
  /** 发送 JSON 消息 */
  sendJSON: <T = unknown>(data: T) => void;
  /** 获取当前重连尝试次数 */
  getReconnectAttempts: () => number;
  /** 重置重连计数器 */
  resetReconnectAttempts: () => void;
}

// 辅助函数：设置 WebSocket 事件处理器
export interface ISetupHandlersParams {
  ws: WebSocket;
  parseJSON: boolean;
  clearTimeoutTimer: () => void;
  stopHeartbeat: () => void;
  updateConnectionState: (state: ConnectionState) => void;
  setError: (error: Error | null) => void;
  setLastMessage: (event: MessageEvent) => void;
  startHeartbeat: () => void;
  flushMessageQueue: () => void;
  getReconnectDelay: () => number;
  clearReconnectTimer: () => void;
  immediateReconnect: boolean;
  reconnectAttempts: number;
  createWebSocket: () => WebSocket | null;
  callbacksRef: React.MutableRefObject<{
    onOpen?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
  }>;
  messageHandlersRef: React.MutableRefObject<Map<string, Set<(event: MessageEvent) => void>>>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  shouldReconnectRef: React.MutableRefObject<boolean>;
  isManualDisconnectRef: React.MutableRefObject<boolean>;
  webSocketRef: React.MutableRefObject<WebSocket | null>;
  setWebSocket: (ws: WebSocket | null) => void;
  reconnectTimerRef: React.MutableRefObject<number | null>;
}
