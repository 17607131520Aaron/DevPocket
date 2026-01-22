/**
 * Mock 数据平台类型定义
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export interface IMockRule {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  enabled: boolean;
  statusCode: number;
  responseHeaders?: Record<string, string>;
  responseBody: unknown;
  delay?: number; // 延迟响应时间（毫秒）
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface IMockRuleFormData {
  name: string;
  method: HttpMethod;
  path: string;
  enabled: boolean;
  statusCode: number;
  responseHeaders?: Record<string, string>;
  responseBody: string; // JSON 字符串
  delay?: number;
  description?: string;
}
