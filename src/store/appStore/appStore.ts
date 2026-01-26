import { menuItems } from "@/Layout/constants";
import { createPersistStore } from "@/store";

const appStore = createPersistStore('appStore', ((set) => ({
  //路由列表
  routerList: [],
  //设置路由列表
  setRouterList: () => {
    set({ routerList: menuItems });
  },
  //用户信息
  userInfo: null,
  //设置用户信息
  setUserInfo: () => {
    set({
      username: "admin",
      userId: "1234567890",
      userRole: "admin",
      userPermission: "admin",
      userToken: "1234567890",
      userExpiresAt: 1716666666666,
      userRefreshToken: "1234567890",
      userRefreshExpiresAt: 1716666666666,
      userAccessToken: "1234567890",
      userAccessExpiresAt: 1716666666666,
    });
  },
})))

export { appStore }
