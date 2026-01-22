import type {
  IUseSocketOptions,
  IUseSocketReturn,
  IUseSSEOptions,
  IUseSSEReturn,
  IUseWebSocketOptions,
  IUseWebSocketReturn,
} from "./type";
import { useSocket } from "./useSocket";
import { useSSE } from "./useSSE";
import { useWebSocket } from "./useWebSocket";

export { useSocket, useSSE, useWebSocket };
export type {
  IUseSocketOptions,
  IUseSocketReturn,
  IUseSSEOptions,
  IUseSSEReturn,
  IUseWebSocketOptions,
  IUseWebSocketReturn,
};
