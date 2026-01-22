import React, { useState, useCallback, useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { menuItems } from "./constants";
import { TabsContext } from "./TabsContextValue";
import type { ITabItem, MenuItemType } from "./types";

// 从菜单配置中获取页面标题
const getPageTitle = (path: string): string => {
  const findLabel = (items: MenuItemType[]): string | null => {
    for (const item of items) {
      if (!item || typeof item === "string") {
        continue;
      }

      if (item.key === path && "label" in item && item.label) {
        return typeof item.label === "string" ? item.label : String(item.label);
      }

      if ("children" in item && item.children) {
        const childLabel = findLabel(item.children as MenuItemType[]);
        if (childLabel) {
          return childLabel;
        }
      }
    }
    return null;
  };

  return findLabel((menuItems || []) as MenuItemType[]) || "未命名页面";
};

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<ITabItem[]>([
    {
      key: "/",
      label: "首页",
      path: "/",
      closable: false, // 首页不可关闭
    },
  ]);
  const [activeKey, setActiveKey] = useState<string>("/");
  const [refreshKey, setRefreshKey] = useState<string>("");
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  // 添加标签
  const addTab = useCallback((path: string) => {
    setTabs((prevTabs) => {
      // 检查标签是否已存在
      const existingTab = prevTabs.find((tab) => tab.path === path);
      if (existingTab) {
        return prevTabs;
      }

      // 创建新标签
      const newTab: ITabItem = {
        key: path,
        label: getPageTitle(path),
        path,
        closable: path !== "/", // 首页不可关闭
      };

      return [...prevTabs, newTab];
    });
    setActiveKey(path);
  }, []);

  // 移除标签
  const removeTab = useCallback(
    (key: string) => {
      setTabs((prevTabs) => {
        const newTabs = prevTabs.filter((tab) => tab.key !== key);

        // 如果关闭的是当前激活的标签，切换到其他标签
        if (key === activeKey && newTabs.length > 0) {
          const currentIndex = prevTabs.findIndex((tab) => tab.key === key);
          const targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          const targetTab = newTabs[targetIndex];
          if (targetTab) {
            setActiveKey(targetTab.key);
            navigate(targetTab.path);
          }
        }

        return newTabs;
      });
    },
    [activeKey, navigate],
  );

  // 设置活动标签
  const setActiveTab = useCallback(
    (key: string) => {
      setActiveKey(key);
      const tab = tabs.find((t) => t.key === key);
      if (tab) {
        // 标记为标签切换，避免触发页面重新加载
        setIsTabSwitching(true);
        navigate(tab.path);
        // 延迟清除标志，确保路由变化完成
        setTimeout(() => {
          setIsTabSwitching(false);
        }, 100);
      }
    },
    [tabs, navigate],
  );

  // 关闭其他标签
  const closeOtherTabs = useCallback(
    (key: string) => {
      setTabs((prevTabs) => {
        return prevTabs.filter((tab) => tab.key === key || !tab.closable);
      });
      setActiveKey(key);
      const tab = tabs.find((t) => t.key === key);
      if (tab) {
        navigate(tab.path);
      }
    },
    [tabs, navigate],
  );

  // 关闭所有标签（保留首页）
  const closeAllTabs = useCallback(() => {
    setTabs((prevTabs) => {
      return prevTabs.filter((tab) => !tab.closable);
    });
    setActiveKey("/");
    navigate("/");
  }, [navigate]);

  // 刷新标签页
  const refreshTab = useCallback(
    (key: string) => {
      const tab = tabs.find((t) => t.key === key);
      if (tab) {
        // 设置刷新状态
        setRefreshingKey(key);

        // 触发页面刷新事件，让页面组件可以监听并重新加载数据
        window.dispatchEvent(
          new CustomEvent("tab-refresh", {
            detail: { path: tab.path, key },
          }),
        );

        // 更新 refreshKey 来强制重新渲染
        const newRefreshKey = `${tab.path}-${Date.now()}`;
        setRefreshKey(newRefreshKey);

        // 如果刷新的是当前活动标签，直接更新 refreshKey 即可
        // 如果刷新的是非活动标签，先切换到该标签
        if (key !== activeKey) {
          navigate(tab.path);
        }
      }
    },
    [tabs, navigate, activeKey],
  );

  // 监听路由变化，自动添加标签
  useEffect(() => {
    const path = location.pathname || "/";
    addTab(path);
  }, [location.pathname, addTab]);

  // 同步活动标签
  useEffect(() => {
    const path = location.pathname || "/";
    setActiveKey(path);
  }, [location.pathname]);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeKey,
        refreshKey,
        refreshingKey,
        isTabSwitching,
        addTab,
        removeTab,
        setActiveTab,
        closeOtherTabs,
        closeAllTabs,
        refreshTab,
        setRefreshingKey,
        setIsTabSwitching,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};
