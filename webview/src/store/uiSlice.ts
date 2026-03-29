import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type ToastLevel = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
  duration?: number;
}

type SidebarPanel = "branches" | "stash" | "remotes" | "tags" | "tools";
type RightPanel = "commit" | "diff" | "blame" | "conflicts" | null;

interface UISlice {
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;
  rightPanelOpen: boolean;
  rightPanel: RightPanel;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  toasts: Toast[];
  theme: "dark" | "light";
  density: "compact" | "comfortable" | "spacious";
  soundEnabled: boolean;
  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleRightPanel: () => void;
  setRightPanel: (panel: RightPanel) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  addToast: (level: ToastLevel, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setDensity: (density: "compact" | "comfortable" | "spacious") => void;
  toggleSound: () => void;
}

let toastId = 0;

export const useUIStore = create<UISlice>()(
  immer((set) => ({
    sidebarOpen: true,
    sidebarPanel: "branches",
    rightPanelOpen: false,
    rightPanel: null,
    commandPaletteOpen: false,
    settingsOpen: false,
    toasts: [],
    theme: "dark",
    density: "comfortable",
    soundEnabled: true,

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    setSidebarPanel: (panel) =>
      set((state) => {
        state.sidebarPanel = panel;
        state.sidebarOpen = true;
      }),

    toggleRightPanel: () =>
      set((state) => {
        state.rightPanelOpen = !state.rightPanelOpen;
      }),

    setRightPanel: (panel) =>
      set((state) => {
        state.rightPanel = panel;
        state.rightPanelOpen = panel !== null;
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open;
      }),

    setSettingsOpen: (open) =>
      set((state) => {
        state.settingsOpen = open;
      }),

    addToast: (level, message, duration = 5000) =>
      set((state) => {
        const id = `toast-${++toastId}`;
        state.toasts.push({ id, level, message, duration });
        if (duration > 0) {
          setTimeout(() => {
            set((s) => {
              s.toasts = s.toasts.filter((t: Toast) => t.id !== id);
            });
          }, duration);
        }
      }),

    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t: Toast) => t.id !== id);
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),

    setDensity: (density) =>
      set((state) => {
        state.density = density;
      }),

    toggleSound: () =>
      set((state) => {
        state.soundEnabled = !state.soundEnabled;
      }),
  }))
);
