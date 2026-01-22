// import { useEffect } from "react";

// import { useDebugLogsStore, useNetworkStore } from "@/store";

// /**
//  * 监控页面初始化组件
//  * 在应用启动时自动初始化网络监控和调试日志的连接
//  */
// const MonitorInitializer: React.FC = () => {
//   const networkStore = useNetworkStore();
//   const debugLogsStore = useDebugLogsStore();

//   useEffect(() => {
//     // 应用启动时自动连接网络监控
//     if (!networkStore.isConnected && !networkStore.isConnecting) {
//       networkStore.setShouldConnect(true);
//       networkStore.incrementConnectRequestId();
//     }

//     // 应用启动时自动连接调试日志
//     if (!debugLogsStore.isConnected && !debugLogsStore.isConnecting) {
//       debugLogsStore.setShouldConnect(true);
//       debugLogsStore.incrementConnectRequestId();
//     }
//   }, []); // 只在组件挂载时执行一次

//   // 这个组件不渲染任何内容
//   return null;
// };

// export default MonitorInitializer;
