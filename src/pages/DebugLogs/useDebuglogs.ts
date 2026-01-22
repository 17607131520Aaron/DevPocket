import { useCallback, useEffect, useMemo, useRef } from "react";

import { useWebSocket } from "@/hooks/useSocket";
import { useDebugLogsStore } from "@/store";

import { DEFAULT_MAX_LOGS, DEFAULT_RECONNECT_DELAY } from "./constants";
import type { IJsLogItem, IMetroLogMessage, LogLevel } from "./type";

export const useDebuglogs = (): {
  port: number;
  setPort: React.Dispatch<React.SetStateAction<number>>;
  isConnecting: boolean;
  isConnected: boolean;
  logs: IJsLogItem[];
  levelFilter: string;
  setLevelFilter: React.Dispatch<React.SetStateAction<string>>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  filteredLogs: IJsLogItem[];
  handleConnectClick: () => void;
  handleClearLogs: () => void;
  handleClose: () => void;
} => {
  // 从 store 读取状态
  const {
    port,
    isConnecting,
    isConnected,
    logs,
    levelFilter,
    searchText,
    shouldConnect,
    connectRequestId,
    setPort: setPortStore,
    setIsConnecting,
    setIsConnected,
    addLog,
    setLevelFilter: setLevelFilterStore,
    setSearchText: setSearchTextStore,
    setShouldConnect,
    incrementConnectRequestId,
    clearLogs,
  } = useDebugLogsStore();

  // 构建 WebSocket URL
  // 连接到独立的日志服务器（而不是 Metro bundler 的 logger 端点）
  const wsUrl = useMemo(() => {
    if (!shouldConnect) {
      return "";
    }
    // 从环境变量获取 WebSocket 服务器地址，如果没有则使用当前主机
    const envWsUrl = (import.meta as { env?: { VITE_WS_URL?: string } }).env?.VITE_WS_URL;
    const wsHost = envWsUrl ? new URL(envWsUrl).hostname : window.location.hostname;
    // 使用指定端口（默认 8082）
    return `ws://${wsHost}:${port}/logs`;
  }, [port, shouldConnect]);

  // 用于记录是否已经记录过连接日志，避免重复记录
  const hasLoggedConnectionRef = useRef(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) {
        return false;
      }
      if (searchText.trim()) {
        return log.message.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    });
  }, [logs, levelFilter, searchText]);

  const appendLog = useCallback(
    (log: IJsLogItem) => {
      // 限制最大日志数量
      const currentLogs = useDebugLogsStore.getState().logs;
      if (currentLogs.length >= DEFAULT_MAX_LOGS) {
        // 移除最旧的日志
        const newLogs = currentLogs.slice(1);
        useDebugLogsStore.getState().setLogs(newLogs);
      }
      addLog(log);
    },
    [addLog],
  );

  const parseMetroMessage = useCallback((data: unknown): IJsLogItem => {
    let level: IJsLogItem["level"] = "unknown";
    let message = "";
    let raw: unknown = data;

    try {
      // 处理字符串格式的数据
      if (typeof data === "string") {
        raw = data;

        // 尝试检查是否是包含日志级别的字符串格式（Metro bundler常见格式）
        // 格式可能是: "LOG\n{json数据}\n额外文本" 或 "LOG {json数据}"
        const trimmed = data.trim();
        const upperTrimmed = trimmed.toUpperCase();

        // 检查字符串开头是否是日志级别标记（支持多行格式）
        const levelMatch = upperTrimmed.match(/^(LOG|INFO|WARN|ERROR|DEBUG|TRACE)(\s|\n|$)/);
        if (levelMatch && levelMatch[1] && levelMatch[0]) {
          const matchedLevel = levelMatch[1].toLowerCase();
          if (["log", "info", "warn", "error", "debug"].includes(matchedLevel)) {
            level = matchedLevel as LogLevel;
            // 移除级别标记，提取实际消息
            const matchLength = levelMatch[0].length;
            const remainingContent = trimmed.substring(matchLength).trim();

            // 如果剩余内容以 { 或 [ 开头，尝试解析为JSON
            if (remainingContent.startsWith("{") || remainingContent.startsWith("[")) {
              try {
                const parsed = JSON.parse(remainingContent);
                raw = { level, data: parsed, original: data };
                message = JSON.stringify(parsed, null, 2);
              } catch {
                // JSON解析失败，使用原始文本
                message = remainingContent;
              }
            } else {
              message = remainingContent || "(无消息内容)";
            }
          } else {
            level = "unknown";
            message = trimmed;
          }
        } else {
          // 尝试解析为JSON
          try {
            const parsed = JSON.parse(data);
            raw = parsed;

            // 如果是对象，按照对象格式处理
            if (parsed && typeof parsed === "object") {
              const metroData = parsed as IMetroLogMessage;

              // 检查是否是自定义日志消息（type: 'js-log'）
              if (metroData.type === "js-log" && typeof metroData.level === "string") {
                const metroLevel = metroData.level.toLowerCase();
                if (["log", "info", "warn", "error", "debug"].includes(metroLevel)) {
                  level = metroLevel as LogLevel;
                }
                // 提取消息内容
                if (typeof metroData.message === "string") {
                  message = metroData.message;
                  const context = (metroData as { context?: unknown })["context"];
                  if (context) {
                    message += `\n${JSON.stringify(context, null, 2)}`;
                  }
                } else {
                  message = JSON.stringify(metroData, null, 2);
                }
              }
              // 检查是否是 Metro bundler 控制消息
              else if ("method" in metroData || "version" in metroData) {
                level = "debug"; // 控制消息使用 debug 级别
                message = `[Metro控制消息] ${metroData.method || "未知"}: ${JSON.stringify(parsed, null, 2)}`;
              }
              // 标准日志格式
              else if (typeof metroData.level === "string") {
                const metroLevel = metroData.level.toLowerCase();
                if (["log", "info", "warn", "error", "debug"].includes(metroLevel)) {
                  level = metroLevel as LogLevel;
                }
              }

              // 如果还没有设置 message，继续处理
              if (!message && Array.isArray(metroData.data)) {
                message = (metroData.data as unknown[])
                  .map((item: unknown) => {
                    if (typeof item === "string") {
                      return item;
                    }
                    try {
                      return JSON.stringify(item, null, 2);
                    } catch {
                      return String(item);
                    }
                  })
                  .join("\n");
              } else if (metroData.message !== null && metroData.message !== undefined) {
                message =
                  typeof metroData.message === "string"
                    ? metroData.message
                    : JSON.stringify(metroData.message, null, 2);
              } else {
                message = JSON.stringify(metroData, null, 2);
              }
            } else {
              message = String(parsed);
            }
          } catch {
            // JSON解析失败，作为普通字符串处理
            message = trimmed;
            level = "log"; // 默认为log级别
          }
        }
      } else if (data && typeof data === "object") {
        // 已经是对象（可能已经被useWebSocket的parseJSON解析过了）
        raw = data;
        const metroData = data as IMetroLogMessage;

        if (typeof metroData.level === "string") {
          level = metroData.level.toLowerCase() as LogLevel;
        }

        if (Array.isArray(metroData.data)) {
          message = (metroData.data as unknown[])
            .map((item: unknown) => {
              if (typeof item === "string") {
                return item;
              }
              try {
                return JSON.stringify(item, null, 2);
              } catch {
                return String(item);
              }
            })
            .join("\n");
        } else if (metroData.message !== null && metroData.message !== undefined) {
          message =
            typeof metroData.message === "string" ? metroData.message : JSON.stringify(metroData.message, null, 2);
        } else {
          // 尝试从对象中提取有用信息
          const metroDataRecord = metroData as Record<string, unknown>;
          const { level: _, data: __, message: ___ } = metroDataRecord;
          const rest: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(metroDataRecord)) {
            if (key !== "level" && key !== "data" && key !== "message") {
              rest[key] = value;
            }
          }
          if (Object.keys(rest).length > 0) {
            message = JSON.stringify(rest, null, 2);
          } else {
            message = JSON.stringify(metroData, null, 2);
          }
        }
      } else {
        message = String(data);
        level = "log"; // 默认为log级别
      }
    } catch {
      // 所有解析都失败，使用原始数据
      message = String(data);
      raw = data;
    }

    // 如果消息为空，使用原始数据的字符串表示
    if (!message || message.trim() === "") {
      try {
        message = JSON.stringify(raw, null, 2);
      } catch {
        message = String(raw);
      }
    }

    return {
      id: `${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().getTime(),
      level,
      message,
      raw,
    };
  }, []);

  // 使用 WebSocket hook，充分利用其回调功能
  const { isConnected: wsConnected, isConnecting: wsConnecting, error, connect, disconnect } = useWebSocket({
    url: wsUrl,
    autoConnect: false,
    reconnect: true,
    reconnectInterval: DEFAULT_RECONNECT_DELAY,
    parseJSON: false, // 不自动解析 JSON，手动处理以支持 Metro bundler 的字符串格式
    onOpen: useCallback(
      (_event: Event) => {
        hasLoggedConnectionRef.current = true;
        const timestamp = new Date().getTime();
        appendLog({
          id: `${timestamp}-system-connected`,
          timestamp,
          level: "info",
          message: `已连接到 Metro Logger: ${wsUrl}`,
          raw: null,
        });
      },
      [wsUrl, appendLog],
    ),
    onClose: useCallback(
      (event: CloseEvent) => {
        hasLoggedConnectionRef.current = false;
        const timestamp = new Date().getTime();
        appendLog({
          id: `${timestamp}-system-closed`,
          timestamp,
          level: "warn",
          message: `与 Metro Logger 的连接已断开${event.reason ? `: ${event.reason}` : ""}`,
          raw: { code: event.code, reason: event.reason, wasClean: event.wasClean },
        });
      },
      [appendLog],
    ),
    onError: useCallback(
      (event: Event) => {
        const timestamp = new Date().getTime();
        appendLog({
          id: `${timestamp}-system-error`,
          timestamp,
          level: "error",
          message: "与 Metro Logger 通信发生错误",
          raw: event,
        });
      },
      [appendLog],
    ),
    onMessage: useCallback(
      (event: MessageEvent) => {
        // event.data 是原始数据（字符串或Blob），需要手动解析
        const dataToParse: unknown = event.data;

        // 如果是 Blob，转换为文本
        if (event.data instanceof Blob) {
          event.data
            .text()
            .then((text) => {
              const logItem = parseMetroMessage(text);
              appendLog(logItem);
            })
            .catch((err) => {
              console.error("[useDebuglogs] Failed to read Blob data:", err);
              appendLog({
                id: `${Date.now()}-parse-error`,
                timestamp: Date.now(),
                level: "error",
                message: `解析日志消息失败: ${err}`,
                raw: event.data,
              });
            });
          return;
        }

        // 调试：输出原始消息以便排查问题
        console.log("[useDebuglogs] 收到原始消息:", typeof dataToParse, dataToParse);

        const logItem = parseMetroMessage(dataToParse);

        // 过滤掉 Metro bundler 的控制消息（如 reload、reconnect 等），只保留日志消息
        if (typeof dataToParse === "string") {
          try {
            const parsed = JSON.parse(dataToParse);
            // 如果是控制消息（包含 method 字段），标记但不显示或显示为调试信息
            if (parsed && typeof parsed === "object" && "method" in parsed) {
              // Metro bundler 控制消息，可以显示为 debug 级别或忽略
              logItem.level = "debug";
              logItem.message = `[Metro控制消息] ${parsed.method}: ${JSON.stringify(parsed, null, 2)}`;
            }
          } catch {
            // 不是 JSON，正常处理
          }
        }

        appendLog(logItem);
      },
      [parseMetroMessage, appendLog],
    ),
  });

  // 同步 WebSocket 状态到 store
  useEffect(() => {
    setIsConnected(wsConnected);
    setIsConnecting(wsConnecting);
  }, [wsConnected, wsConnecting, setIsConnected, setIsConnecting]);

  // 处理错误状态
  useEffect(() => {
    if (error && shouldConnect) {
      const timestamp = new Date().getTime();
      appendLog({
        id: `${timestamp}-system-error-state`,
        timestamp,
        level: "error",
        message: `WebSocket 错误: ${error.message}`,
        raw: error,
      });
    }
  }, [error, shouldConnect, appendLog]);

  // 监听 wsUrl 和 connectRequestId 的变化，自动连接
  useEffect(() => {
    // 当 shouldConnect 为 true 且 wsUrl 有效时，自动连接
    if (shouldConnect && wsUrl && wsUrl.trim() !== "" && connectRequestId > 0) {
      // 如果已经连接，不重复连接
      if (isConnected) {
        return;
      }
      // 如果正在连接，不重复连接
      if (isConnecting) {
        return;
      }
      // 直接连接，useEffect 本身就在状态更新后执行，不需要 setTimeout
      setIsConnecting(true);
      connect();
    }
  }, [wsUrl, shouldConnect, connectRequestId, isConnected, isConnecting, connect, setIsConnecting]);

  // 监听连接状态，当从连接变为断开时，如果 shouldConnect 为 true，触发重连
  const prevIsConnectedRef = useRef(isConnected);
  useEffect(() => {
    // 如果之前是连接状态，现在断开了，且 shouldConnect 为 true，说明需要重连
    if (prevIsConnectedRef.current && !isConnected && !isConnecting && shouldConnect) {
      // 增加连接请求 ID，强制触发连接逻辑
      incrementConnectRequestId();
    }
    prevIsConnectedRef.current = isConnected;
  }, [isConnected, isConnecting, shouldConnect, incrementConnectRequestId]);

  const handleConnectClick = useCallback(() => {
    if (isConnected) {
      // 重连：先断开，断开后会自动触发重连逻辑（通过监听 isConnected 变化）
      setShouldConnect(true);
      disconnect();
    } else {
      // 设置连接标志和请求 ID，触发 useEffect 中的自动连接逻辑
      setShouldConnect(true);
      // 增加请求 ID，确保即使 shouldConnect 已经是 true 也能触发连接
      incrementConnectRequestId();
    }
  }, [isConnected, disconnect, setShouldConnect, incrementConnectRequestId]);

  const handleClearLogs = useCallback(() => {
    clearLogs();
  }, [clearLogs]);

  const handleClose = useCallback(() => {
    setShouldConnect(false);
    disconnect();
    appendLog({
      id: `${Date.now()}-system-closed`,
      timestamp: Date.now(),
      level: "info",
      message: "连接已关闭",
      raw: null,
    });
  }, [disconnect, appendLog, setShouldConnect]);

  // setPort 包装函数，支持直接设置值或使用函数
  const setPortWrapper = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (typeof value === "function") {
        const currentPort = useDebugLogsStore.getState().port;
        setPortStore(value(currentPort));
      } else {
        setPortStore(value);
      }
    },
    [setPortStore],
  );

  // setLevelFilter 包装函数
  const setLevelFilterWrapper = useCallback(
    (value: string | ((prev: string) => string)) => {
      if (typeof value === "function") {
        const currentFilter = useDebugLogsStore.getState().levelFilter;
        setLevelFilterStore(value(currentFilter));
      } else {
        setLevelFilterStore(value);
      }
    },
    [setLevelFilterStore],
  );

  // setSearchText 包装函数
  const setSearchTextWrapper = useCallback(
    (value: string | ((prev: string) => string)) => {
      if (typeof value === "function") {
        const currentText = useDebugLogsStore.getState().searchText;
        setSearchTextStore(value(currentText));
      } else {
        setSearchTextStore(value);
      }
    },
    [setSearchTextStore],
  );

  return {
    // 状态
    port,
    setPort: setPortWrapper,
    isConnecting,
    isConnected,
    logs,
    levelFilter,
    setLevelFilter: setLevelFilterWrapper,
    searchText,
    setSearchText: setSearchTextWrapper,
    // 计算属性
    filteredLogs,
    // 方法
    handleConnectClick,
    handleClearLogs,
    handleClose,
  };
};
