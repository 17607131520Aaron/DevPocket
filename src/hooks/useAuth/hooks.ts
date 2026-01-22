import { useCallback, useEffect, useMemo, useState } from "react";

import userServices from "@/services/userServices";
import { useUserInfoStore, type IUserInfo } from "@/store";
import { deleteProjectInfo, getProjectInfo, saveProjectInfo } from "@/utils/indexedDBStorage";

const AUTH_STORAGE_KEY = "auth_info";

export interface IAuthUser {
  // 根据实际业务扩展字段，这里先用通用结构占位
  [key: string]: unknown;
}

export interface IAuthState {
  token: string | null;
  user: IAuthUser | null;
  /** token 过期时间（时间戳，毫秒），null 表示不过期或由后端控制 */
  expiresAt: number | null;
}

interface IUseAuthResult extends IAuthState {
  loading: boolean;
  isAuthenticated: boolean;
  tokenExpired: boolean;
  /**
   * 登录成功后保存 token / 用户信息
   * @param token 访问令牌
   * @param user  用户信息
   * @param expiresAt 过期时间（时间戳，毫秒），可选
   */
  login: (token: string, user: IAuthUser, expiresAt?: number | null) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuth = (): IUseAuthResult => {
  const [state, setState] = useState<IAuthState>({
    token: null,
    user: null,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(true);
  const { setUser: setStoreUser, logout: storeLogout } = useUserInfoStore();

  // 初始化时从 IndexedDB 中恢复登录态
  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async (): Promise<void> => {
      try {
        const stored = await getProjectInfo<IAuthState>(AUTH_STORAGE_KEY);
        if (!isMounted || !stored || !stored.token) {
          return;
        }

        const now = Date.now();
        const expiresAt = stored.expiresAt ?? null;

        // token 过期：清理本地状态
        if (expiresAt !== null && expiresAt <= now) {
          await deleteProjectInfo(AUTH_STORAGE_KEY);
          storeLogout();
          return;
        }

        if (isMounted) {
          setState({
            token: stored.token ?? null,
            user: stored.user ?? null,
            expiresAt,
          });
          // 同步用户信息到 store（不包括 token）
          if (stored.user) {
            setStoreUser(stored.user as IUserInfo);
          }
        }
      } catch (error) {
        console.warn("恢复登录状态失败（已忽略）：", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, [setStoreUser, storeLogout]);

  const login = useCallback(
    async (token: string, user: IAuthUser, expiresAt?: number | null): Promise<void> => {
      const normalizedExpiresAt = typeof expiresAt === "number" && Number.isFinite(expiresAt) ? expiresAt : null;

      const nextState: IAuthState = { token, user, expiresAt: normalizedExpiresAt };
      setState(nextState);

      // 保存 token 和登录账号信息到 IndexedDB
      try {
        await saveProjectInfo(AUTH_STORAGE_KEY, nextState);
      } catch (error) {
        console.warn("保存登录信息失败（已忽略）：", error);
      }

      // 保存用户信息（不包括 token）到 store
      setStoreUser(user as IUserInfo);
    },
    [setStoreUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    // 调用后端登出接口，撤销 token
    try {
      await userServices.logout();
    } catch (error) {
      // 即使后端登出失败，也继续清理本地状态
      console.warn("后端登出失败（已忽略）：", error);
    }

    setState({ token: null, user: null, expiresAt: null });

    // 清除 IndexedDB 中的登录信息
    try {
      await deleteProjectInfo(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn("清理登录信息失败（已忽略）：", error);
    }

    // 清除 store 中的用户信息
    storeLogout();
  }, [storeLogout]);

  const tokenExpired = useMemo(() => {
    if (!state.token) {
      return false;
    }
    if (state.expiresAt === null) {
      return false;
    }
    return state.expiresAt <= Date.now();
  }, [state.token, state.expiresAt]);

  const isAuthenticated = useMemo(() => {
    if (!state.token) {
      return false;
    }
    return !tokenExpired;
  }, [state.token, tokenExpired]);

  return {
    ...state,
    loading,
    isAuthenticated,
    tokenExpired,
    login,
    logout,
  };
};

export default useAuth;
