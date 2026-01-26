/**
 * Zustand Store 统一导出
 */

export { createPersistStore } from "./createPersistStore";
export { PERSIST_NAMESPACES, getStorageKey, shouldPersist } from "./config";

// 在这里导出各个具体的 store
export { useUserInfoStore } from "./userStore/userInfo";
export type { IUserInfo, IUserInfoState, IUserInfoStore } from "./userStore/type";

export { useNetworkStore } from "./networkStore";
export type { INetworkStore } from "./networkStore";

export { useDebugLogsStore } from "./debugLogsStore";
export type { IDebugLogsStore } from "./debugLogsStore";

export { appStore } from "./appStore/appStore";
