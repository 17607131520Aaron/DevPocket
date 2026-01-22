import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

import { menuItems } from "./constants";
import { getKeysToOpen, flattenMenuItems, filterMenuItems } from "./utils"

import type { IUseAppReturn, MenuItemType } from "./type";

const useApp = (): IUseAppReturn => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // 获取当前选中的菜单项
  const selectedKeys = useMemo(() => {
    const path = location.pathname || "/";
    const keys: string[] = [];

    // 遍历菜单项找到匹配的路径
    menuItems?.forEach((item: MenuItemType | null | string | undefined) => {
      if (!item || typeof item === "string") {
        return;
      }

      // 精确匹配首页
      if (item.key === "/" && (path === "/" || path === "")) {
        keys.push("/");
      } else if (item.key === path) {
        keys.push(path);
      } else if ("children" in item && item.children) {
        item.children.forEach((child) => {
          if (child && typeof child !== "string" && child.key === path) {
            keys.push(path);
          }
        });
      }
    });

    // 如果没有匹配到，默认选中首页
    return keys.length > 0 ? keys : ["/"];
  }, [location.pathname]);

  // 初始化时计算默认展开的菜单
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const path = location.pathname || "/";
    return getKeysToOpen(path);
  });

  // 根据搜索值生成扁平化搜索结果
  const flatSearchResults = useMemo(() => {
    if (!searchValue.trim()) {
      return [];
    }
    return flattenMenuItems(menuItems, searchValue);
  }, [searchValue]);

  // 根据搜索值过滤菜单（用于树形菜单）
  const filteredMenuItems = useMemo(() => {
    return filterMenuItems(menuItems, searchValue);
  }, [searchValue]);

  // 搜索时自动展开匹配的菜单
  useEffect(() => {
    if (searchValue.trim()) {
      const keysToOpen: string[] = [];
      menuItems?.forEach((item: MenuItemType | null | string | undefined) => {
        if (!item || typeof item === "string" || item.type === "divider") {
          return;
        }
        if ("children" in item && item.children) {
          const hasMatch = item.children.some((child: MenuItemType | null | string | undefined) => {
            if (!child || typeof child === "string" || child.type === "divider") {
              return false;
            }
            const childLabel = "label" in child && child.label ? child.label.toString().toLowerCase() : "";
            return childLabel.includes(searchValue.toLowerCase());
          });
          if (hasMatch && item.key) {
            keysToOpen.push(item.key as string);
          }
        }
      });
      setOpenKeys(keysToOpen);
    }
    // 移除 else 分支，不再在路由变化时重置 openKeys
  }, [searchValue]);

  // 监听路由变化，自动展开当前路径对应的菜单（但不收起已展开的菜单）
  useEffect(() => {
    if (!searchValue.trim()) {
      // 只在非搜索状态下，自动展开当前路径对应的菜单
      const path = location.pathname || "/";
      const keysToOpenForCurrentPath = getKeysToOpen(path);

      // 将当前路径对应的菜单 key 添加到已展开的列表中（如果不存在）
      setOpenKeys((prevKeys) => {
        const newKeys = [...prevKeys];
        keysToOpenForCurrentPath.forEach((key) => {
          if (!newKeys.includes(key)) {
            newKeys.push(key);
          }
        });
        return newKeys;
      });
    }
  }, [location.pathname, searchValue]);

  // 菜单点击处理
  const handleMenuClick = ({ key }: { key: string }): void => {
    // 只处理叶子节点（有实际路径的菜单项）
    if (key.startsWith("/")) {
      navigate(key);
    }
  };

  // 菜单展开/收起处理
  const handleOpenChange = (keys: string[]): void => {
    setOpenKeys(keys);
  };

  // 用户菜单点击处理
  const handleUserMenuClick = ({ key }: { key: string }): void => {
    if (key === "logout") {
      // 处理退出登录逻辑
      void logout().then(() => {
        navigate("/login", { replace: true });
      });
    } else if (key === "profile") {
      // 处理个人中心跳转
      navigate("/profile");
    } else if (key === "settings") {
      // 处理账户设置跳转
      navigate("/settings/basic");
    }
  };

  return {
    // 状态
    collapsed,
    handleComplete: (broken: boolean): void => {
      setCollapsed(broken);
    },
    searchValue,
    handleSearchChange: (value: string): void => {
      setSearchValue(value);
    },
    openKeys,
    selectedKeys,
    flatSearchResults,
    filteredMenuItems,
    handleMenuClick,
    handleOpenChange,
    handleUserMenuClick,
  };
};

export default useApp
