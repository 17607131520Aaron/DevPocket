import React from "react";

import {
  AppstoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Input, Layout, List, Menu } from "antd";

import useApp from "./useApp";

import type { IFlatMenuItem } from "./type"

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
    flatSearchResults
  } = useApp();

  //判断是否显示搜索结果
  const showSearchResults = searchValue.trim() && !collapsed;

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
            {!collapsed && <div className="devpocket-sider-header-logo-title">我不知道叫什么</div>}
          </div>
        </div>

        {!collapsed && <div className="devpocket-sider-search">
          <Input
            allowClear
            placeholder="搜索菜单"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
          />
        </div>}

        {showSearchResults ? <div className="devpocket-sider-search-results">
          <div className="devpocket-sider-search-results-count">
            共搜索到 {flatSearchResults.length} 项与"{searchValue}"相关的菜单
          </div>
          <List<IFlatMenuItem>
            className="devpocket-sider-search-results-list"
            dataSource={flatSearchResults}
            renderItem={(item: IFlatMenuItem) => (
              <List.Item
                className={`devpocket-sider-search-result-item ${selectedKeys.includes(item.key) ? "devpocket-sider-search-result-item-selected" : ""
                  }`}
                onClick={() => {
                  if (item.key.startsWith("/")) {
                    handleMenuClick({ key: item.key });
                  }
                }}
              >
                <div className="devpocket-sider-search-result-content">
                  {item.icon && <span className="devpocket-sider-search-result-icon">{item.icon}</span>}
                  <span className="devpocket-sider-search-result-label">
                    {item.parentLabel ? `${item.parentLabel} / ${item.label}` : item.label}
                  </span>
                </div>
              </List.Item>
            )}
          />
        </div>
          :
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
          </div>}
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
