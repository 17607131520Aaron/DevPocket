import React from "react";

import { Outlet, useLocation } from "react-router-dom";

import {
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Input, Layout, List, Menu, Space, Spin, Typography } from "antd";

import PerformanceMonitor from "@/components/PerformanceMonitorWrapper/usePerformanceMonitor";
import { useUserInfoStore } from "@/store";

import { userMenuItems } from "./constants";
import TabsBar from "./TabsBar";
import { TabsProvider } from "./TabsContext";
import { useApp } from "./useApp";

import type { IFlatMenuItem } from "./types";

import "./app.scss";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppContent: React.FC = () => {
  const location = useLocation();
  const {
    collapsed,
    setCollapsed,
    searchValue,
    setSearchValue,
    openKeys,
    selectedKeys,
    flatSearchResults,
    filteredMenuItems,
    isLoading,
    isRefreshing,
    refreshKey,
    handleMenuClick,
    handleOpenChange,
    handleUserMenuClick,
  } = useApp();
  const { user } = useUserInfoStore();

  // 获取显示的用户名：优先使用真实姓名，如果没有则使用账号
  const displayName =
    user && typeof user === "object" && "realName" in user && user["realName"]
      ? String(user["realName"])
      : user && typeof user === "object" && "username" in user && user["username"]
        ? String(user["username"])
        : "管理员";

  return (
    <Layout className="asp-comprehension-home" style={{ height: "100vh", overflow: "hidden" }}>
      <Sider
        collapsible
        breakpoint="md"
        className="asp-comprehension-home-menu"
        collapsed={collapsed}
        collapsedWidth={80}
        trigger={null}
        width={240}
        onBreakpoint={(broken: boolean) => {
          // 小屏幕时自动折叠侧边栏，提升可用空间；恢复到大屏时展开
          setCollapsed(broken);
        }}
      >
        <div className="asp-comprehension-home-menu-header">
          <div className="asp-comprehension-home-menu-logo">
            <div className="asp-comprehension-home-menu-logo-icon">
              <AppstoreOutlined />
            </div>
            {!collapsed && <span className="asp-comprehension-home-menu-logo-title">不知道叫啥的某系统</span>}
          </div>
        </div>

        {!collapsed ? (
          <div className="asp-comprehension-home-menu-search">
            <Input
              allowClear
              placeholder="搜索菜单"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
            />
          </div>
        ) : (
          <div className="asp-comprehension-home-menu-search-collapsed">
            <div
              className="asp-comprehension-home-menu-search-icon"
              onClick={() => {
                setCollapsed(false);
              }}
            >
              <SearchOutlined />
            </div>
          </div>
        )}

        <div className="asp-comprehension-home-menu-divider" />

        {searchValue.trim() && !collapsed ? (
          <div className="asp-comprehension-home-menu-search-results">
            <div className="asp-comprehension-home-menu-search-results-count">
              共搜索到 {flatSearchResults.length} 项与"{searchValue}"相关的菜单
            </div>
            <List<IFlatMenuItem>
              className="asp-comprehension-home-menu-search-results-list"
              dataSource={flatSearchResults}
              renderItem={(item: IFlatMenuItem) => (
                <List.Item
                  className={`asp-comprehension-home-menu-search-result-item ${
                    selectedKeys.includes(item.key) ? "asp-comprehension-home-menu-search-result-item-selected" : ""
                  }`}
                  onClick={() => {
                    if (item.key.startsWith("/")) {
                      handleMenuClick({ key: item.key });
                    }
                  }}
                >
                  <div className="asp-comprehension-home-menu-search-result-content">
                    {item.icon && <span className="asp-comprehension-home-menu-search-result-icon">{item.icon}</span>}
                    <span className="asp-comprehension-home-menu-search-result-label">
                      {item.parentLabel ? `${item.parentLabel} / ${item.label}` : item.label}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <Menu
            className="asp-comprehension-home-menu-content"
            items={filteredMenuItems}
            mode="inline"
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            theme="light"
            onClick={handleMenuClick}
            onOpenChange={handleOpenChange}
          />
        )}
      </Sider>

      <Layout style={{ height: "100%", overflow: "hidden" }}>
        <Header className="asp-comprehension-home-header">
          <div className="asp-comprehension-home-header-content">
            <div className="asp-comprehension-home-header-left">
              <div className="asp-comprehension-home-header-toggle" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            </div>

            <div className="asp-comprehension-home-header-center">
              <TabsBar />
            </div>

            <div className="asp-comprehension-home-header-right">
              <Space size="middle">
                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleUserMenuClick,
                  }}
                  placement="bottomRight"
                >
                  <Space className="asp-comprehension-home-header-content-user" style={{ cursor: "pointer" }}>
                    <Avatar icon={<UserOutlined />} size={32} style={{ backgroundColor: "#237ffa" }} />
                    <Text style={{ fontSize: 14, color: "#595959" }}>{displayName}</Text>
                  </Space>
                </Dropdown>
              </Space>
            </div>
          </div>
        </Header>

        <Content className="asp-comprehension-home-content">
          <div className="asp-comprehension-home-content-wrapper">
            <Spin
              size="large"
              spinning={isLoading}
              style={{ height: "100%" }}
              tip={isRefreshing ? "页面刷新中..." : "页面加载中..."}
            >
              <div style={{ height: "100%" }}>
                <PerformanceMonitor enableConsoleLog id={`Page-${location.pathname}`}>
                  <Outlet key={`${location.pathname}-${refreshKey}`} />
                </PerformanceMonitor>
              </div>
            </Spin>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <TabsProvider>
      <AppContent />
    </TabsProvider>
  );
};

export default App;
