declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

export interface VsCodeApi {
  postMessage: (msg: unknown) => void;
  getState: () => unknown;
  setState: (s: unknown) => void;
}

export function getVsCodeApi(): VsCodeApi | null {
  if (typeof window !== "undefined" && window.acquireVsCodeApi) {
    return window.acquireVsCodeApi();
  }
  return null;
}
