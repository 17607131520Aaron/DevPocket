import { useCallback, useEffect, useRef, useState } from "react";

import { useLocation } from "react-router-dom";

import { useTabs } from "@/app/useApp";

import type { IUseTableRequestOptions, IUseTableRequestReturn } from "./type";

/**
 * 用于表格列表和 tab 切换的请求 Hook
 * 解决竞态问题：通过请求序列号确保只处理最新请求的响应
 *
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useTableRequest({
 *   requestFn: (params) => get({ url: '/api/list', data: params }),
 *   params: { page: 1, pageSize: 10 },
 *   refreshOnTabSwitch: true,
 * });
 * ```
 */
export function useTableRequest<TParams = unknown, TData = unknown>(
  options: IUseTableRequestOptions<TParams, TData>,
): IUseTableRequestReturn<TData, TParams> {
  const {
    requestFn,
    params,
    immediate = true,
    deps = [],
    refreshOnTabSwitch = true,
    refreshOnTabRefresh = true,
    onSuccess,
    onError,
  } = options;

  const location = useLocation();
  const { activeKey, refreshKey, isTabSwitching } = useTabs();

  // 请求序列号，用于解决竞态问题
  const requestIdRef = useRef<number>(0);
  // AbortController，用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null);
  // 上一次的 location.pathname，用于检测路由变化
  const prevPathnameRef = useRef<string>(location.pathname);
  // 上一次的 refreshKey，用于检测 tab 刷新
  const prevRefreshKeyRef = useRef<string>(refreshKey);

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);

  // 执行请求的核心函数
  const executeRequest = useCallback(
    async (requestParams?: TParams, signal?: AbortSignal): Promise<TData | undefined> => {
      // 生成新的请求 ID
      const currentRequestId = ++requestIdRef.current;
      const finalParams = (requestParams ?? params) as TParams;

      // 如果没有提供 signal，创建新的 AbortController
      let finalSignal = signal;
      if (!finalSignal) {
        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();
        finalSignal = abortControllerRef.current.signal;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await requestFn(finalParams, finalSignal);

        // 检查请求是否已被取消
        if (finalSignal?.aborted) {
          return undefined;
        }

        // 检查是否是最新的请求（解决竞态问题）
        if (currentRequestId !== requestIdRef.current) {
          // 这不是最新的请求，忽略响应
          return undefined;
        }

        // 这是最新的请求，更新状态
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        // 检查请求是否已被取消
        if (finalSignal?.aborted || (err as Error).name === "AbortError") {
          return undefined;
        }

        // 检查是否是最新的请求
        if (currentRequestId !== requestIdRef.current) {
          return undefined;
        }

        // 这是最新的请求，更新错误状态
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        onError?.(error);
        throw error;
      }
    },
    [requestFn, params, onSuccess, onError],
  );

  // 手动触发请求
  const run = useCallback(
    async (requestParams?: TParams): Promise<TData | undefined> => {
      return await executeRequest(requestParams);
    },
    [executeRequest],
  );

  // 手动刷新请求
  const refresh = useCallback(async (): Promise<TData | undefined> => {
    return await executeRequest();
  }, [executeRequest]);

  // 取消当前请求
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 增加请求 ID，使任何正在进行的请求都会被忽略
    requestIdRef.current++;
    setLoading(false);
  }, []);

  // 监听依赖项变化，自动重新请求
  useEffect(() => {
    if (!immediate) {
      return;
    }

    executeRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // 监听 tab 切换，自动重新请求
  useEffect(() => {
    if (!refreshOnTabSwitch || !immediate) {
      return undefined;
    }

    const currentPathname = location.pathname;
    const pathnameChanged = prevPathnameRef.current !== currentPathname;

    // 如果路径变化，直接执行请求
    // useEffect 在 DOM 更新后执行，此时组件已准备好
    // 竞态问题已通过请求序列号解决，无需延迟
    if (pathnameChanged) {
      prevPathnameRef.current = currentPathname;
      executeRequest();
    }
    return undefined;
  }, [location.pathname, activeKey, refreshOnTabSwitch, immediate, executeRequest, isTabSwitching]);

  // 监听 tab 刷新，自动重新请求
  useEffect(() => {
    if (!refreshOnTabRefresh || !immediate) {
      return undefined;
    }

    const refreshKeyChanged = prevRefreshKeyRef.current !== refreshKey;
    if (refreshKeyChanged && refreshKey) {
      prevRefreshKeyRef.current = refreshKey;
      // useEffect 在 DOM 更新后执行，此时组件已准备好
      // 竞态问题已通过请求序列号解决，无需延迟
      executeRequest();
    }
    return undefined;
  }, [refreshKey, refreshOnTabRefresh, immediate, executeRequest]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    error,
    run,
    refresh,
    cancel,
  };
}
