/**
 * 登录请求参数
 */
export interface ILoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface ILoginResponse {
  token: string;
  expiresIn: number; // 过期时间（秒）
}

/**
 * 注册请求参数
 */
export interface IRegisterParams {
  username: string;
  password: string;
  realName: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}

/**
 * 注册响应数据
 */
export interface IRegisterResponse {
  message: string;
}

/**
 * 用户信息响应
 */
export interface IUserInfoResponse {
  id: number;
  username: string;
  realName: string | null;
  email: string | null;
  phone: string | null;
}
