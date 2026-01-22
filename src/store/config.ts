/**
 * Zustand 持久化配置
 * 只有在此配置名单中的命名空间才会被持久化
 */

/**
 * 需要持久化的命名空间列表
 * 命名规则：模块名/功能名（例如：user/profile, settings/basic）
 */
export const PERSIST_NAMESPACES = [
  "user/info", // 用户模块/用户信息（登录信息）
  "monitor/network", // 监控模块/网络监控（端口、连接状态等）
  "monitor/debugLogs", // 监控模块/调试日志（端口、过滤条件等）
  // 示例：用户模块/个人资料
  // "user/profile",
  // 示例：设置模块/基础设置
  // "settings/basic",
] as const;

/**
 * 持久化存储的 key 前缀
 */
export const STORAGE_KEY_PREFIX = "zustand-store";

/**
 * 获取存储 key
 * @param namespace 命名空间（格式：模块名/功能名）
 */
export const getStorageKey = (namespace: string): string => {
  return `${STORAGE_KEY_PREFIX}:${namespace}`;
};

/**
 * 检查命名空间是否需要持久化
 * @param namespace 命名空间（格式：模块名/功能名）
 */
export const shouldPersist = (namespace: string): boolean => {
  return PERSIST_NAMESPACES.includes(namespace as (typeof PERSIST_NAMESPACES)[number]);
};
