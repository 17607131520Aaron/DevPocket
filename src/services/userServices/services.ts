import { get, post } from "@/utils/request";

import { ILoginResponse, ILoginParams, IRegisterParams, IRegisterResponse, IUserInfoResponse } from "./type";

class UserServices {
  /**
   * 用户登录
   * @param params 登录参数
   * @returns 登录响应，包含 token 和过期时间
   */
  login = (params: ILoginParams): Promise<ILoginResponse> => {
    return post<ILoginParams, ILoginResponse>({
      url: "/userinfo/userLogin",
      data: params,
    });
  };

  /**
   * 用户注册
   * @param params 注册参数
   * @returns 注册结果消息
   */
  register = (params: IRegisterParams): Promise<IRegisterResponse> => {
    return post<IRegisterParams, IRegisterResponse>({
      url: "/userinfo/registerUser",
      data: params,
    });
  };

  /**
   * 获取当前登录用户信息（需要认证）
   * @returns 用户信息
   */
  getUserInfo = (): Promise<IUserInfoResponse> => {
    return get<never, IUserInfoResponse>({
      url: "/userinfo/getUserInfo",
    });
  };

  /**
   * 通过用户名获取用户信息（无需认证）
   * @param username 用户名
   * @returns 用户信息
   */
  getUserInfoByUsername = (username: string): Promise<IUserInfoResponse> => {
    return get<never, IUserInfoResponse>({
      url: `/userinfo/getUserInfoByUsername?username=${encodeURIComponent(username)}`,
    });
  };

  /**
   * 用户登出
   * @returns 登出结果消息
   */
  logout = (): Promise<string> => {
    return post<never, string>({
      url: "/userinfo/logout",
    });
  };
}
export default new UserServices();
