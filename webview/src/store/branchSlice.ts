import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Branch, BranchFolder } from "../types/git";

interface BranchSlice {
  branches: Branch[];
  currentBranch: string | null;
  folders: BranchFolder[];
  remoteBranches: Branch[];
  isLoading: boolean;
  setBranches: (branches: Branch[]) => void;
  setCurrentBranch: (branch: string | null) => void;
  setFolders: (folders: BranchFolder[]) => void;
  toggleFolder: (name: string) => void;
  setRemoteBranches: (branches: Branch[]) => void;
  setLoading: (loading: boolean) => void;
  clearBranches: () => void;
}

export const useBranchStore = create<BranchSlice>()(
  immer((set) => ({
    branches: [],
    currentBranch: null,
    folders: [],
    remoteBranches: [],
    isLoading: false,

    setBranches: (branches) =>
      set((state) => {
        state.branches = branches;
      }),

    setCurrentBranch: (branch) =>
      set((state) => {
        state.currentBranch = branch;
      }),

    setFolders: (folders) =>
      set((state) => {
        state.folders = folders;
      }),

    toggleFolder: (name) =>
      set((state) => {
        const folder = state.folders.find((f: BranchFolder) => f.name === name);
        if (folder) {
          folder.collapsed = !folder.collapsed;
        }
      }),

    setRemoteBranches: (branches) =>
      set((state) => {
        state.remoteBranches = branches;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    clearBranches: () =>
      set((state) => {
        state.branches = [];
        state.remoteBranches = [];
        state.currentBranch = null;
        state.folders = [];
      }),
  }))
);
