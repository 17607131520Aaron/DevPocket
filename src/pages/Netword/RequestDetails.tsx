import React, { useState } from "react";

import { CopyOutlined } from "@ant-design/icons";
import { Badge, Button, message, Space, Tabs, Tooltip, Typography } from "antd";

import { formatDuration, formatSize, getMethodColor, getStatusColor } from "./constants";
import {
  copyToClipboard,
  formatJSON,
  generateCurlCommand,
  parseQueryParams,
  parseUrl,
  formatTimestamp,
  enhanceRequestHeaders,
} from "./utils";

const { Text } = Typography;

import type { INetworkRequest } from "./type";
const RequestDetails: React.FC<{ request: INetworkRequest | null }> = ({ request }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  if (!request) {
    return (
      <div className="network-details-empty">
        <Text type="secondary">选择一个请求以查看详细信息</Text>
      </div>
    );
  }

  const handleCopyCurl = async (): Promise<void> => {
    const curlCommand = generateCurlCommand(request);
    const success = await copyToClipboard(curlCommand);
    if (success) {
      message.success("curl 命令已复制到剪贴板");
    } else {
      message.error("复制失败");
    }
  };

  const handleCopyJSON = async (data: unknown, label: string): Promise<void> => {
    const jsonStr = formatJSON(data);
    const success = await copyToClipboard(jsonStr);
    if (success) {
      message.success(`${label}已复制到剪贴板`);
    } else {
      message.error("复制失败");
    }
  };

  // 解析 URL 信息
  const urlParts = parseUrl(request.url);
  const queryParams = parseQueryParams(request.url);

  // 增强请求头信息（补充常见的请求头）
  const enhancedHeaders = enhanceRequestHeaders(request);

  const tabs = [
    {
      key: "overview",
      label: "概览",
      children: (
        <div className="network-details-content">
          <div className="network-details-section">
            <Text strong className="network-details-section-title">
              请求信息
            </Text>
            <div className="network-headers-table">
              <div className="network-headers-row">
                <div className="network-headers-key">请求方法:</div>
                <div className="network-headers-value">
                  <span className="network-method-badge" style={{ backgroundColor: getMethodColor(request.method) }}>
                    {request.method}
                  </span>
                </div>
              </div>
              <div className="network-headers-row">
                <div className="network-headers-key">请求 URL:</div>
                <div className="network-headers-value">
                  <Text copyable={{ text: request.url }}>{request.url}</Text>
                </div>
              </div>
              {request.originalUrl && request.originalUrl !== request.url && (
                <div className="network-headers-row">
                  <div className="network-headers-key">原始 URL:</div>
                  <div className="network-headers-value">{request.originalUrl}</div>
                </div>
              )}
              {request.baseURL && (
                <div className="network-headers-row">
                  <div className="network-headers-key">基础 URL:</div>
                  <div className="network-headers-value">{request.baseURL}</div>
                </div>
              )}
              {urlParts.protocol && (
                <div className="network-headers-row">
                  <div className="network-headers-key">协议:</div>
                  <div className="network-headers-value">{urlParts.protocol.replace(":", "")}</div>
                </div>
              )}
              {urlParts.host && (
                <div className="network-headers-row">
                  <div className="network-headers-key">主机:</div>
                  <div className="network-headers-value">{urlParts.host}</div>
                </div>
              )}
              {urlParts.pathname && (
                <div className="network-headers-row">
                  <div className="network-headers-key">路径:</div>
                  <div className="network-headers-value">{urlParts.pathname}</div>
                </div>
              )}
              {request.type && (
                <div className="network-headers-row">
                  <div className="network-headers-key">请求类型:</div>
                  <div className="network-headers-value">{request.type.toUpperCase()}</div>
                </div>
              )}
            </div>
          </div>

          {Object.keys(queryParams).length > 0 && (
            <div className="network-details-section">
              <Text strong className="network-details-section-title">
                Query 参数
              </Text>
              <div className="network-headers-table">
                {Object.entries(queryParams).map(([key, value]) => (
                  <div key={key} className="network-headers-row">
                    <div className="network-headers-key">{key}:</div>
                    <div className="network-headers-value">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!request.params &&
            typeof request.params === "object" &&
            Object.keys(request.params as Record<string, unknown>).length > 0 && (
              <div className="network-details-section">
                <Text strong className="network-details-section-title">
                  请求参数 (GET)
                </Text>
                <Space style={{ marginBottom: 12 }}>
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    type="text"
                    onClick={() => handleCopyJSON(request.params, "请求参数")}
                  >
                    复制
                  </Button>
                </Space>
                <pre className="network-json-viewer">{formatJSON(request.params)}</pre>
              </div>
            )}

          <div className="network-details-section">
            <Text strong className="network-details-section-title">
              响应信息
            </Text>
            <div className="network-headers-table">
              {request.status && (
                <div className="network-headers-row">
                  <div className="network-headers-key">状态码:</div>
                  <div className="network-headers-value">
                    <span style={{ color: getStatusColor(request.status), fontWeight: 500 }}>{request.status}</span>
                  </div>
                </div>
              )}
              {request.error && (
                <div className="network-headers-row">
                  <div className="network-headers-key">错误信息:</div>
                  <div className="network-headers-value" style={{ color: "#ff4d4f" }}>
                    {request.error}
                  </div>
                </div>
              )}
              {request.completed !== undefined && (
                <div className="network-headers-row">
                  <div className="network-headers-key">状态:</div>
                  <div className="network-headers-value">
                    {request.completed ? (
                      <Badge status="success" text="已完成" />
                    ) : (
                      <Badge status="processing" text="进行中" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="network-details-section">
            <Text strong className="network-details-section-title">
              时间信息
            </Text>
            <div className="network-headers-table">
              <div className="network-headers-row">
                <div className="network-headers-key">开始时间:</div>
                <div className="network-headers-value">{formatTimestamp(request.startTime)}</div>
              </div>
              {request.endTime && (
                <div className="network-headers-row">
                  <div className="network-headers-key">结束时间:</div>
                  <div className="network-headers-value">{formatTimestamp(request.endTime)}</div>
                </div>
              )}
              {request.duration !== undefined && (
                <div className="network-headers-row">
                  <div className="network-headers-key">耗时:</div>
                  <div className="network-headers-value">{formatDuration(request.duration)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="network-details-section">
            <Text strong className="network-details-section-title">
              大小信息
            </Text>
            <div className="network-headers-table">
              {request.requestSize !== undefined && (
                <div className="network-headers-row">
                  <div className="network-headers-key">请求大小:</div>
                  <div className="network-headers-value">{formatSize(request.requestSize)}</div>
                </div>
              )}
              {request.responseSize !== undefined && (
                <div className="network-headers-row">
                  <div className="network-headers-key">响应大小:</div>
                  <div className="network-headers-value">{formatSize(request.responseSize)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "headers",
      label: "请求头",
      children: (
        <div className="network-details-content">
          <div className="network-details-section">
            <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
              <Text strong className="network-details-section-title">
                请求头
              </Text>
              <Button
                icon={<CopyOutlined />}
                size="small"
                type="text"
                onClick={() => {
                  const headersText = Object.entries(request.headers || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n");
                  copyToClipboard(headersText).then((success) => {
                    if (success) {
                      message.success("请求头已复制到剪贴板");
                    } else {
                      message.error("复制失败");
                    }
                  });
                }}
              >
                复制所有
              </Button>
            </Space>
            <div className="network-headers-table">
              {Object.entries(enhancedHeaders)
                .sort(([a], [b]) => {
                  // 将重要的请求头排在前面
                  const importantHeaders = [
                    "Protocol",
                    "Cookie",
                    "Authorization",
                    "Content-Type",
                    "User-Agent",
                    "Accept",
                    "Accept-Language",
                    "Accept-Encoding",
                    "Connection",
                    "app-version",
                  ];
                  const aIndex = importantHeaders.indexOf(a);
                  const bIndex = importantHeaders.indexOf(b);
                  if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex;
                  }
                  if (aIndex !== -1) {
                    return -1;
                  }
                  if (bIndex !== -1) {
                    return 1;
                  }
                  return a.localeCompare(b);
                })
                .map(([key, value]) => {
                  // 标记推断的请求头（不在原始请求头中的）
                  const isInferred = !(key in (request.headers || {}));
                  return (
                    <div
                      key={key}
                      className="network-headers-row"
                      style={isInferred ? { opacity: 0.7, fontStyle: "italic" } : {}}
                    >
                      <div className="network-headers-key">
                        {key}:
                        {isInferred && (
                          <Tooltip title="此请求头是根据请求信息推断的常见值">
                            <span style={{ marginLeft: 4, color: "#8c8c8c", fontSize: 10 }}>(推断)</span>
                          </Tooltip>
                        )}
                      </div>
                      <div className="network-headers-value">
                        {key.toLowerCase() === "cookie" && String(value).length > 200 ? (
                          <Tooltip title={String(value)}>
                            <span style={{ cursor: "help" }}>{String(value).substring(0, 200)}...</span>
                          </Tooltip>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(enhancedHeaders).length === 0 && <Text type="secondary">无请求头</Text>}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#8c8c8c" }}>
              共 {Object.keys(enhancedHeaders).length} 个请求头
              {Object.keys(enhancedHeaders).length > Object.keys(request.headers || {}).length && (
                <span style={{ marginLeft: 8 }}>
                  （其中 {Object.keys(request.headers || {}).length} 个为实际发送的请求头）
                </span>
              )}
            </div>
          </div>
          {request.responseHeaders && (
            <div className="network-details-section">
              <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
                <Text strong className="network-details-section-title">
                  响应头
                </Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="text"
                  onClick={() => {
                    const headersText = Object.entries(request.responseHeaders || {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join("\n");
                    copyToClipboard(headersText).then((success) => {
                      if (success) {
                        message.success("响应头已复制到剪贴板");
                      } else {
                        message.error("复制失败");
                      }
                    });
                  }}
                >
                  复制所有
                </Button>
              </Space>
              <div className="network-headers-table">
                {Object.entries(request.responseHeaders)
                  .sort(([a], [b]) => {
                    // 将重要的响应头排在前面
                    const importantHeaders = ["Content-Type", "Content-Length", "Set-Cookie", "Server", "Date"];
                    const aIndex = importantHeaders.indexOf(a);
                    const bIndex = importantHeaders.indexOf(b);
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }
                    if (aIndex !== -1) {
                      return -1;
                    }
                    if (bIndex !== -1) {
                      return 1;
                    }
                    return a.localeCompare(b);
                  })
                  .map(([key, value]) => (
                    <div key={key} className="network-headers-row">
                      <div className="network-headers-key">{key}:</div>
                      <div className="network-headers-value">{String(value)}</div>
                    </div>
                  ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#8c8c8c" }}>
                共 {Object.keys(request.responseHeaders || {}).length} 个响应头
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "payload",
      label: "请求载荷",
      children: (
        <div className="network-details-content">
          {request.method.toUpperCase() === "GET" && request.params ? (
            <div className="network-details-section">
              <Space style={{ marginBottom: 12 }}>
                <Text strong>Query 参数</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleCopyJSON(request.params, "Query 参数")}
                >
                  复制
                </Button>
              </Space>
              <pre className="network-json-viewer">{formatJSON(request.params)}</pre>
            </div>
          ) : request.body || request.data ? (
            <div className="network-details-section">
              <Space style={{ marginBottom: 12 }}>
                <Text strong>请求体</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleCopyJSON(request.body || request.data, "请求体")}
                >
                  复制
                </Button>
              </Space>
              <pre className="network-json-viewer">{formatJSON(request.body || request.data)}</pre>
            </div>
          ) : (
            <div className="network-details-section">
              <Text type="secondary">(无请求载荷)</Text>
            </div>
          )}
          {!!request.data && request.data !== request.body && request.method.toUpperCase() !== "GET" && (
            <div className="network-details-section">
              <Space style={{ marginBottom: 12 }}>
                <Text strong>原始数据</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleCopyJSON(request.data, "原始数据")}
                >
                  复制
                </Button>
              </Space>
              <pre className="network-json-viewer">{formatJSON(request.data)}</pre>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "response",
      label: "响应",
      children: (
        <div className="network-details-content">
          <div className="network-details-section">
            <Space style={{ marginBottom: 12 }}>
              <Text strong>响应内容</Text>
              <Button
                icon={<CopyOutlined />}
                size="small"
                type="text"
                onClick={() => handleCopyJSON(request.responseData, "响应内容")}
              >
                复制
              </Button>
            </Space>
            {request.error ? (
              <pre className="network-json-viewer" style={{ color: "#ff4d4f" }}>
                {request.error}
              </pre>
            ) : (
              <pre className="network-json-viewer">
                {request.responseData ? formatJSON(request.responseData) : "(无响应体)"}
              </pre>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "curl",
      label: "cURL",
      children: (
        <div className="network-details-content">
          <div className="network-details-section">
            <Space style={{ marginBottom: 12 }}>
              <Text strong>cURL 命令</Text>
              <Button icon={<CopyOutlined />} size="small" type="primary" onClick={handleCopyCurl}>
                复制 cURL
              </Button>
            </Space>
            <pre className="network-json-viewer">{generateCurlCommand(request)}</pre>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="network-details">
      <div className="network-details-header">
        <Space>
          <span className="network-method-badge" style={{ backgroundColor: getMethodColor(request.method) }}>
            {request.method}
          </span>
          <Text ellipsis copyable={{ text: request.url }} style={{ maxWidth: 600 }}>
            {request.url}
          </Text>
          {request.status && (
            <Badge status={request.status >= 200 && request.status < 300 ? "success" : "error"} text={request.status} />
          )}
          {request.error && <Badge status="error" text="错误" />}
        </Space>
      </div>

      <Tabs activeKey={activeTab} items={tabs} onChange={setActiveTab} />
    </div>
  );
};
export default RequestDetails;
