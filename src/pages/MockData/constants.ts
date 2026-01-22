import type { SelectProps } from "antd";

/**
 * HTTP 方法选项
 */
export const methodOptions: SelectProps["options"] = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "PATCH", value: "PATCH" },
  { label: "HEAD", value: "HEAD" },
  { label: "OPTIONS", value: "OPTIONS" },
];

/**
 * HTTP 状态码选项
 */
export const statusCodeOptions: SelectProps["options"] = [
  { label: "200 OK", value: 200 },
  { label: "201 Created", value: 201 },
  { label: "204 No Content", value: 204 },
  { label: "400 Bad Request", value: 400 },
  { label: "401 Unauthorized", value: 401 },
  { label: "403 Forbidden", value: 403 },
  { label: "404 Not Found", value: 404 },
  { label: "500 Internal Server Error", value: 500 },
  { label: "502 Bad Gateway", value: 502 },
  { label: "503 Service Unavailable", value: 503 },
];

/**
 * 获取 HTTP 方法颜色
 */
export const getMethodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case "GET":
      return "#52c41a";
    case "POST":
      return "#1890ff";
    case "PUT":
      return "#faad14";
    case "DELETE":
      return "#ff4d4f";
    case "PATCH":
      return "#722ed1";
    default:
      return "#8c8c8c";
  }
};

/**
 * 获取状态码颜色
 */
export const getStatusCodeColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) {
    return "#52c41a";
  }
  if (statusCode >= 300 && statusCode < 400) {
    return "#1890ff";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "#faad14";
  }
  if (statusCode >= 500) {
    return "#ff4d4f";
  }
  return "#8c8c8c";
};

/**
 * 默认 Mock 服务器端口
 */
export const DEFAULT_MOCK_PORT = 3001;

/**
 * 默认响应体模板
 */
export const DEFAULT_RESPONSE_BODY = `{
  "code": 0,
  "message": "success",
  "data": {}
}`;
