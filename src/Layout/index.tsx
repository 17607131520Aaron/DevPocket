import React from "react";

import { AppstoreOutlined, SearchOutlined } from "@ant-design/icons";
import { Layout, Input, Menu } from "antd";

import useApp from "./useApp";
import "./index.scss";
const { Sider } = Layout;

const LayoutPages: React.FC = () => {
  const {
    collapsed,
    searchValue,
    openKeys,
    filteredMenuItems,
    handleComplete,
    handleSearchChange,
    handleMenuClick,
    handleOpenChange,
    selectedKeys,
  } = useApp();

  return (
    <div className="devpocket-pages">
      <Sider
        className="devpocket-sider"
        collapsible
        breakpoint="md"
        collapsed={collapsed}
        collapsedWidth={80}
        trigger={null}
        width={240}
        onBreakpoint={(broken) => {
          handleComplete(broken);
        }}
      >
        <div className="devpocket-sider-header">
          <div className="devpocket-sider-header-logo">
            <div className="devpocket-sider-header-logo-icon">
              <AppstoreOutlined />
            </div>
            <div className="devpocket-sider-header-logo-title">我不知道叫什么</div>
          </div>
        </div>
        <div className="devpocket-sider-search">
          <Input
            allowClear
            placeholder="搜索菜单"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="devpocket-sider-menu">
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
        </div>
      </Sider>
      <Layout className="devpocket-content" />
    </div>
  );
};

const App = () => {
  return (
    <>
      <LayoutPages />
    </>
  );
};

export default App;
