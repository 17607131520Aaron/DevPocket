import { notification } from "antd";
import request from "axios";

import type { IErrorMessage, IRequestConfig, IResponse } from "@/types/baseRequest";
import { getProjectInfo, deleteProjectInfo } from "@/utils/indexedDBStorage";

import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from "axios";

// 业务错误类型，用于标记不应该重试的错误
interface IBusinessError extends Error {
  isBusinessError: true;
}

const apiPrefix = import.meta.env.VITE_APP_BASE_API || "api";
const DEFAULT_TIMEOUT = 5000;

const instance = request.create({
  timeout: DEFAULT_TIMEOUT,
  baseURL: `/${apiPrefix}`,
});

// 请求拦截器
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 从 IndexedDB 读取 token
    const authInfo = await getProjectInfo<{ token: string; user: unknown; expiresAt: number | null }>("auth_info");
    if (authInfo?.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authInfo.token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      handleError(status, data as IResponse);
    } else if (error.request) {
      notification.error({
        message: "网络错误",
        description: "请检查网络连接",
        placement: "bottomRight",
      });
    } else {
      notification.error({
        message: "请求错误",
        description: error.message,
        placement: "bottomRight",
      });
    }
    return Promise.reject(error);
  },
);

// 统一错误处理
const handleError = (status: number, data: IResponse): void => {
  const errorMessages: Record<number, IErrorMessage> = {
    401: {
      message: "提示",
      description: "登录超时，请重新登录",
      action: async () => {
        // 清除 IndexedDB 中的登录信息
        await deleteProjectInfo("auth_info");
        window.location.href = "/login";
      },
    },
    403: {
      message: "权限错误",
      description: "您没有权限访问该资源",
    },
    404: {
      message: "系统提示",
      description: "访问地址不存在，请联系管理员",
    },
    500: {
      message: "系统错误",
      description: data?.message || "服务器内部错误",
    },
  };

  const error = errorMessages[status] || {
    message: "错误",
    description: data?.message || "系统异常",
  };

  notification.error({
    message: error.message,
    description: error.description,
    placement: "bottomRight",
  });

  if (error.action) {
    error.action();
  }
};

// 统一响应处理
// 注意：只有 HTTP status === 200 的响应才会到达这里
// HTTP 错误（如 401, 403, 404, 500）会在响应拦截器中处理
const parse = <R>(res: AxiosResponse, params: { handleRaw?: boolean }): R => {
  const { data } = res;
  const { handleRaw } = params;

  if (handleRaw) {
    return data as R;
  }

  const responseData = data as IResponse;
  if (responseData.code === 0) {
    return responseData.data as R;
  }

  // code !== 0 时，这是业务逻辑错误，不应该重试
  // 直接显示业务错误消息，而不是通过 handleError（因为 HTTP status 是 200）
  notification.error({
    message: "请求失败",
    description: responseData?.message || "业务逻辑错误",
    placement: "bottomRight",
  });
  const businessError = new Error(responseData?.message || "请求失败") as IBusinessError;
  businessError.isBusinessError = true;
  throw businessError;
};

const requestMethod = async <T, R>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  config: IRequestConfig<T>,
): Promise<R> => {
  const { retry = 0 } = config;
  let attempts = 0;
  let lastError: unknown;

  while (attempts <= retry) {
    try {
      const { url, data, handleRaw, timeout = 5000, cancelToken } = config;
      const response = await instance({
        method,
        url,
        ...(method === "GET" ? { params: data } : { data }),
        timeout,
        signal: cancelToken?.signal,
      });
      return parse<R>(response, { handleRaw: !!handleRaw });
    } catch (error) {
      lastError = error;
      attempts++;

      // 以下情况不应该重试：
      // 1. 取消请求
      // 2. 认证错误（401）
      // 3. 业务逻辑错误（code !== 0）
      // 4. 已达到最大重试次数
      const axiosError = error as AxiosError;
      const businessError = error as IBusinessError;
      if (
        axiosError.code === "ERR_CANCELED" ||
        axiosError.response?.status === 401 ||
        businessError.isBusinessError ||
        attempts > retry
      ) {
        throw error;
      }
    }
  }

  throw lastError || new Error("请求失败，已达到最大重试次数");
};

// 导出请求方法
export const get = <T, R>(config: IRequestConfig<T>): Promise<R> => requestMethod<T, R>("GET", config);

export const post = <T, R>(config: IRequestConfig<T>): Promise<R> => requestMethod<T, R>("POST", config);

export const put = <T, R>(config: IRequestConfig<T>): Promise<R> => requestMethod<T, R>("PUT", config);

export const del = <T, R>(config: IRequestConfig<T>): Promise<R> => requestMethod<T, R>("DELETE", config);

// 文件上传公共逻辑
const uploadFiles = async <T>(
  url: string,
  files: (File | Blob)[],
  options: {
    handleRaw?: boolean;
    timeout?: number;
    cancelToken?: AbortController;
  },
): Promise<T> => {
  const formData = new FormData();
  files.forEach((file, index) => {
    if (!(file instanceof File || file instanceof Blob)) {
      throw new Error(`Element at index ${index} is not a File or Blob object`);
    }
    formData.append("files", file);
  });

  const response = await instance({
    method: "POST",
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: options.timeout,
    signal: options.cancelToken?.signal,
  });
  return await Promise.resolve(parse(response, { handleRaw: !!options.handleRaw }));
};

// 文件上传方法
export const uploadSingleFile = async <T>(config: IRequestConfig<File | Blob>): Promise<T> => {
  if (!config.data) {
    throw new Error("File or Blob data is required");
  }
  return await uploadFiles<T>(config.url, [config.data], {
    handleRaw: config.handleRaw,
    timeout: config.timeout,
    cancelToken: config.cancelToken,
  });
};

export const uploadFile = async <T>(config: IRequestConfig<File[] | Blob[]>): Promise<T> => {
  if (!Array.isArray(config.data)) {
    throw new Error("Data must be an array of File or Blob objects");
  }
  if (config.data.length === 0) {
    throw new Error("At least one file is required");
  }
  return await uploadFiles<T>(config.url, config.data, {
    handleRaw: config.handleRaw,
    timeout: config.timeout,
    cancelToken: config.cancelToken,
  });
};
