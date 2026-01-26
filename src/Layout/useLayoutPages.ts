/* eslint-disable unused-imports/no-unused-vars */
import { useState, useMemo } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { menuItems } from "./constants";
import { filterMenuItems, flattenMenuItems, getKeysToOpen } from "./utils";
const useLayoutPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const path = location.pathname || "/";
    return getKeysToOpen(path);
  });

  //根据搜索值过滤菜单（用于树形菜单）
  const filteredMenuItems = filterMenuItems(menuItems, searchValue);

  //根据搜索值生成扁平化搜索结果
  const flatSearchResults = useMemo(() => {
    if (!searchValue.trim()) {
      return [];
    }
    return flattenMenuItems(menuItems, searchValue);
  }, [searchValue]);

  // 菜单点击处理
  const handleMenuClick = ({ key }: { key: string }): void => {
    // 只处理叶子节点（有实际路径的菜单项）
    if (key.startsWith("/")) {
      navigate(key);
    }
  };

  const handleUserMenuClick = ({ key }: { key: string }): void => {
    console.log(key, 'key');
  };

  return {
    collapsed,
    searchValue,
    openKeys,
    filteredMenuItems,
    flatSearchResults,
    handleComplete: (broken: boolean): void => {
      setCollapsed(broken);
    },
    handleSearchChange: (value: string): void => {
      setSearchValue(value);
    },
    handleOpenChange: (keys: string[]): void => {
      setOpenKeys(keys);
    },
    handleMenuClick,
    handleUserMenuClick
  };
};

export default useLayoutPages;
