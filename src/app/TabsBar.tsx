import React, { useRef, useEffect, useState } from "react";

import { CloseOutlined, ReloadOutlined } from "@ant-design/icons";

import { useTabs } from "./useApp";
import "./TabsBar.scss";

const TabsBar: React.FC = () => {
  const { tabs, activeKey, setActiveTab, removeTab, closeOtherTabs, refreshTab } = useTabs();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const [refreshingTabs, setRefreshingTabs] = useState<Set<string>>(new Set());

  // 滚动到活动标签
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const activeTab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      if (tabRect.left < containerRect.left) {
        container.scrollLeft = activeTab.offsetLeft - 20;
      } else if (tabRect.right > containerRect.right) {
        container.scrollLeft = activeTab.offsetLeft - containerRect.width + tabRect.width + 20;
      }
    }
  }, [activeKey]);

  // 处理标签点击
  const handleTabClick = (tab: (typeof tabs)[0], e: React.MouseEvent): void => {
    e.stopPropagation();
    if (tab.key !== activeKey) {
      setActiveTab(tab.key);
    }
  };

  // 处理刷新按钮点击
  const handleRefresh = (tab: (typeof tabs)[0], e: React.MouseEvent): void => {
    e.stopPropagation();
    setRefreshingTabs((prev) => new Set(prev).add(tab.key));
    refreshTab(tab.key);
    // 500ms 后移除刷新动画
    setTimeout(() => {
      setRefreshingTabs((prev) => {
        const next = new Set(prev);
        next.delete(tab.key);
        return next;
      });
    }, 500);
  };

  // 处理关闭按钮点击
  const handleClose = (tab: (typeof tabs)[0], e: React.MouseEvent): void => {
    e.stopPropagation();
    removeTab(tab.key);
  };

  // 处理右键菜单
  const handleContextMenu = (tab: (typeof tabs)[0], e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    // 这里可以添加右键菜单功能，暂时先实现关闭其他标签
    if (tab.closable && tabs.length > 1) {
      closeOtherTabs(tab.key);
    }
  };

  console.log(tabs, "tabs");

  return (
    <div className="asp-tabs-bar">
      <div ref={tabsContainerRef} className="asp-tabs-bar-container">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <div
              key={tab.key}
              ref={isActive ? activeTabRef : null}
              className={`asp-tabs-bar-item ${isActive ? "active" : ""}`}
              onClick={(e) => handleTabClick(tab, e)}
              onContextMenu={(e) => handleContextMenu(tab, e)}
            >
              {isActive && (
                <span
                  className={`asp-tabs-bar-item-refresh ${refreshingTabs.has(tab.key) ? "refreshing" : ""}`}
                  title="刷新页面"
                  onClick={(e) => handleRefresh(tab, e)}
                >
                  <ReloadOutlined />
                </span>
              )}
              <span className="asp-tabs-bar-item-label">{tab.label}</span>
              {tab.closable && (
                <span className="asp-tabs-bar-item-close" title="关闭标签" onClick={(e) => handleClose(tab, e)}>
                  <CloseOutlined />
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* {tabs.length > 1 && (
        <div className="asp-tabs-bar-actions">
          <span
            className="asp-tabs-bar-action-item"
            title="关闭所有标签"
            onClick={closeAllTabs}
          >
            关闭全部
          </span>
        </div>
      )} */}
    </div>
  );
};

export default TabsBar;
