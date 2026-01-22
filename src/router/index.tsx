import { lazy } from "react";

import { createHashRouter } from "react-router-dom";
import type { DataRouter } from "react-router-dom";

const LayoutHome = lazy(() => import("@/Layout"));
const Home = lazy(() => import("@/pages/Home"));
const SmartserviceappDebugLogs = lazy(() => import("@/pages/DebugLogs"));
const SmartserviceappDebugNetwork = lazy(() => import("@/pages/Netword"));
const MockDataPlatform = lazy(() => import("@/pages/MockData"));

const router: DataRouter = createHashRouter([
  {
    path: "/",
    element: <LayoutHome />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "/debuglogs",
        element: <SmartserviceappDebugLogs />,
      },
      {
        path: "/network",
        element: <SmartserviceappDebugNetwork />,
      },
      {
        path: "/mock-data",
        element: <MockDataPlatform />,
      },
    ],
  },
]);

export default router;
