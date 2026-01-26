import {
  ApiOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { MenuProps } from "antd";
// 菜单项配置 - 支持一级和二级菜单
export const menuItems: NonNullable<MenuProps["items"]> = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: "首页",
  },
  {
    key: "/debuglogs",
    icon: <UnorderedListOutlined />,
    label: "日志",
  },
  {
    key: "/network",
    icon: <ApiOutlined />,
    label: "网络",
  },
  {
    key: "/network-logs",
    icon: <UnorderedListOutlined />,
    label: "网络日志",
  },
];

// 用户下拉菜单
export const userMenuItems: NonNullable<MenuProps["items"]> = [
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "个人中心",
  },
  {
    key: "settings",
    icon: <SettingOutlined />,
    label: "账户设置",
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "退出登录",
    danger: true,
  },
];
