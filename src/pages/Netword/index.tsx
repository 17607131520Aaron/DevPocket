import React, { useState, useMemo } from "react";

import {
  ClearOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Input, InputNumber, Select, Space, Spin, Table, Tooltip, Typography } from "antd";

import {
  DEFAULT_PORT,
  formatDuration,
  formatSize,
  getMethodColor,
  getStatusColor,
} from "./constants";
import RequestDetails from "./RequestDetails";
import useNetworkMonitor from "./useNetworkMonitor";

import type { INetworkRequest } from "./type";
import "./index.scss";

const { Text } = Typography;
const { Search } = Input;

const NetwordPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const {
    port,
    isConnecting,
    isConnected,
    selectedRequest,
    filteredRequests,
    isRecording,
    setPort,
    setSelectedRequest,
    setIsRecording,
    handleConnectClick,
    handleClearRequests,
    handleClose,
  } = useNetworkMonitor();

  const columns = [
    {
      title: "名称",
      dataIndex: "url",
      key: "url",
      ellipsis: {
        showTitle: true,
      },
      render: (_value: unknown, record: INetworkRequest) => (
        <Space style={{ width: "100%" }} size="small">
          <span className="network-method-badge" style={{ backgroundColor: getMethodColor(record.method), flexShrink: 0 }}>
            {record.method}
          </span>
          <Text ellipsis={{ tooltip: record.url }} style={{ flex: 1, minWidth: 0 }}>
            {record.url}
          </Text>
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      ellipsis: {
        showTitle: true,
      },
      render: (_value: unknown, record: INetworkRequest) => {
        if (record.error) {
          return <span style={{ color: "#ff4d4f", fontWeight: 500 }}>错误</span>;
        }
        if (!record.completed) {
          return <span style={{ color: "#1890ff", fontWeight: 500 }}>进行中</span>;
        }
        const statusText = String(record.status || "-");
        return <span style={{ color: getStatusColor(record.status), fontWeight: 500 }}>{statusText}</span>;
      },
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      ellipsis: {
        showTitle: true,
      },
      render: (_value: unknown, record: INetworkRequest) => {
        const typeText = (record.type || "xhr").toUpperCase();
        return <Text type="secondary" ellipsis={{ tooltip: typeText }}>{typeText}</Text>;
      },
    },
    {
      title: "大小",
      dataIndex: "responseSize",
      key: "size",
      width: 100,
      ellipsis: {
        showTitle: true,
      },
      render: (_value: unknown, record: INetworkRequest) => {
        const sizeText = formatSize(record.responseSize);
        return <Text type="secondary" ellipsis={{ tooltip: sizeText }}>{sizeText}</Text>;
      },
    },
    {
      title: "时间",
      dataIndex: "duration",
      key: "time",
      width: 120,
      ellipsis: {
        showTitle: true,
      },
      render: (_value: unknown, record: INetworkRequest) => {
        const durationText = formatDuration(record.duration);
        return <Text type="secondary" ellipsis={{ tooltip: durationText }}>{durationText}</Text>;
      },
    },
  ];

  const filteredData = useMemo(() => {
    return filteredRequests.filter((item) => {
      if (searchText && !item.url.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (methodFilter !== "all" && item.method.toUpperCase() !== methodFilter.toUpperCase()) {
        return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "success" && (!item.status || item.status < 200 || item.status >= 300)) {
          return false;
        }
        if (statusFilter === "error" && item.status && item.status >= 200 && item.status < 300) {
          return false;
        }
      }
      return true;
    });
  }, [filteredRequests, searchText, methodFilter, statusFilter]);

  return (
    <div className="network-monitor">
      <Card className="network-toolbar">
        <Space wrap size="middle" style={{ width: "100%" }}>
          <Space>
            <Text strong>连接状态：</Text>
            {isConnecting ? (
              <Space>
                <Spin size="small" />
                <Text type="secondary">连接中...</Text>
              </Space>
            ) : (
              <Badge status={isConnected ? "success" : "error"} text={isConnected ? "已连接" : "未连接"} />
            )}
          </Space>

          <Space>
            <Text strong>端口：</Text>
            <InputNumber
              max={9999}
              min={1}
              placeholder="请输入端口"
              style={{ width: 120 }}
              value={port}
              onChange={(value: number | null) => {
                if (typeof value === "number") {
                  setPort(value);
                }
              }}
            />
          </Space>

          <Space>
            <Tooltip title="连接">
              <Button icon={<ReloadOutlined />} loading={isConnecting} type="primary" onClick={handleConnectClick}>
                {isConnected ? "重连" : "连接"}
              </Button>
            </Tooltip>

            <Tooltip title="关闭连接">
              <Button danger disabled={!isConnected && !isConnecting} icon={<StopOutlined />} onClick={handleClose}>
                关闭
              </Button>
            </Tooltip>

            <Tooltip title={isRecording ? "暂停记录" : "继续记录"}>
              <Button
                disabled={!isConnected}
                icon={isRecording ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? "暂停" : "继续"}
              </Button>
            </Tooltip>

            <Tooltip title="清除所有请求">
              <Button icon={<ClearOutlined />} onClick={handleClearRequests}>
                清除
              </Button>
            </Tooltip>
          </Space>

          <Space style={{ marginLeft: "auto" }}>
            <Select
              options={[
                { label: "全部", value: "all" },
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" },
                { label: "PUT", value: "PUT" },
                { label: "DELETE", value: "DELETE" },
                { label: "PATCH", value: "PATCH" },
              ]}
              placeholder="方法"
              style={{ width: 100 }}
              value={methodFilter}
              onChange={setMethodFilter}
            />
            <Select
              options={[
                { label: "全部", value: "all" },
                { label: "成功", value: "success" },
                { label: "错误", value: "error" },
              ]}
              placeholder="状态"
              style={{ width: 100 }}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <Search
              allowClear
              placeholder="过滤请求..."
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Space>
        </Space>
      </Card>
      <div className="network-content">
        <div className="network-list">
          <Card className="network-list-card">
            {!isConnected ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Text type="secondary">请先连接到网络监控服务器</Text>
                <br />
                <Text style={{ fontSize: 12 }} type="secondary">
                  默认端口: {DEFAULT_PORT} (网络监控服务器)
                </Text>
              </div>
            ) : (
              <Table
                columns={columns}
                bordered
                dataSource={filteredData}
                rowKey="id"
                scroll={{ y: 600 }}
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedRequest(record);
                  },
                  style: { cursor: "pointer" },
                })}
              />
            )}
          </Card>
        </div>
        <div className="network-details-panel">
          <Card className="network-details-card">
            <RequestDetails request={selectedRequest} />
          </Card>
        </div>
      </div>
    </div>
  );
};
export default NetwordPage;
