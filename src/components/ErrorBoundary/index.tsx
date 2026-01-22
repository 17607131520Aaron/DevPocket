import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { reportClientIssue } from "@/utils/errorReporter";
import "./index.module.scss";

interface IErrorBoundaryProps {
  children: ReactNode;
  scope?: string;
  fallback?: ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public override state: IErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, message: String(error?.message || "未知错误") };
  }

  public override async componentDidCatch(error: Error, info: ErrorInfo): Promise<void> {
    const stack = error?.stack;
    const componentStack = info.componentStack;

    await reportClientIssue({
      type: "react-render",
      scope: this.props.scope || "App",
      message: error?.message || "组件渲染异常",
      ...(stack ? { stack } : {}),
      ...(componentStack ? { componentStack } : {}),
    });
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={"errorContainer"}>
          <div className={"errorTitle"}>页面出错了</div>
          <div className={"errorMessage"}>{this.state.message || "请稍后重试"}</div>
          <div className={"buttonGroup"}>
            <button className={"reloadButton"} onClick={() => window.location.reload()}>
              刷新页面
            </button>
            <button className={"retryButton"} onClick={this.handleRetry}>
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: "" });
  };
}

export default ErrorBoundary;
