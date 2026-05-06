import React from 'react';
import { safeClearLocalEditorState } from '../lib/storage';

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application render error', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    safeClearLocalEditorState();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-xl rounded-xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur">
          <div className="text-sm font-semibold text-blue-200">编辑器遇到运行错误</div>
          <h1 className="mt-3 text-2xl font-bold">页面没有崩成黑屏，我先把错误拦住了。</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            这通常由浏览器本地状态、插件渲染异常或资源请求失败触发。可以先刷新；如果仍然失败，清除本地编辑器状态后重试。
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-rose-100">
            {this.state.error.message || String(this.state.error)}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
            >
              刷新页面
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              清除本地状态并重试
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
