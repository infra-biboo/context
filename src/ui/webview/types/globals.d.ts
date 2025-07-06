// Global types for webview environment
import type { WebviewApi } from "vscode-webview";

declare global {
  function acquireVsCodeApi(): WebviewApi<unknown>;
  
  interface Window {
    acquireVsCodeApi: () => WebviewApi<unknown>;
  }
}

export {};