/**
 * 用户信息接口
 */
export interface IUserInfo {
  // 根据实际业务扩展字段，这里先用通用结构占位
  [key: string]: unknown;
}

/**
 * 用户信息 Store 状态
 */
export interface IUserInfoState {
  /** 用户信息（不包括 token） */
  user: IUserInfo | null;
}

/**
 * 用户信息 Store Actions
 */
export interface IUserInfoActions {
  /**
   * 保存用户信息（不包括 token）
   * @param user 用户信息
   */
  setUser: (user: IUserInfo) => void;
  /**
   * 登出，清空用户信息
   */
  logout: () => void;
  /**
   * 更新用户信息
   * @param user 新的用户信息（部分更新）
   */
  updateUser: (user: Partial<IUserInfo>) => void;
}

/**
 * 用户信息 Store 类型
 */
export type IUserInfoStore = IUserInfoState & IUserInfoActions;
