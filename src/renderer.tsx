import { Suspense } from "react";

import { RouterProvider } from "react-router-dom";

import { createRoot } from "react-dom/client";

import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorReportingProvider from "@/components/ErrorReportingProvider";
import LoadingFallback from "@/components/LoadingFallback";
import PerformanceMonitorWrapper from "@/components/PerformanceMonitorWrapper";

import routers from "./router";
import "antd/dist/reset.css";
import "./render.scss";
const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
  <ErrorReportingProvider>
    <ErrorBoundary scope="AppRoot">
      <PerformanceMonitorWrapper>
        <Suspense fallback={<LoadingFallback />}>
          <RouterProvider router={routers} />
        </Suspense>
      </PerformanceMonitorWrapper>
    </ErrorBoundary>
  </ErrorReportingProvider>,
);
