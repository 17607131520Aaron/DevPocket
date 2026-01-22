import type React from "react";

import type { IRequestConfig } from "@/types/baseRequest";

/**
 * 表格请求 Hook 配置选项
 */
export interface IUseTableRequestOptions<TParams = unknown, TData = unknown> {
  /** 请求函数 */
  requestFn: (params: TParams, signal?: AbortSignal) => Promise<TData>;
  /** 请求参数 */
  params?: TParams;
  /** 是否立即执行请求（默认 true） */
  immediate?: boolean;
  /** 依赖项数组，当依赖项变化时自动重新请求 */
  deps?: React.DependencyList;
  /** 是否在 tab 切换时自动重新请求（默认 true） */
  refreshOnTabSwitch?: boolean;
  /** 是否在 tab 刷新时自动重新请求（默认 true） */
  refreshOnTabRefresh?: boolean;
  /** 请求配置（如 timeout、retry 等） */
  requestConfig?: Omit<IRequestConfig<TParams>, "url" | "data" | "cancelToken">;
  /** 请求成功回调 */
  onSuccess?: (data: TData) => void;
  /** 请求失败回调 */
  onError?: (error: Error) => void;
}

/**
 * 表格请求 Hook 返回值
 */
export interface IUseTableRequestReturn<TData = unknown, TParams = unknown> {
  /** 数据 */
  data: TData | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 手动触发请求 */
  run: (params?: TParams) => Promise<TData | undefined>;
  /** 手动刷新请求 */
  refresh: () => Promise<TData | undefined>;
  /** 取消当前请求 */
  cancel: () => void;
}
