import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RepoState } from "../types/git";

interface RepoSlice {
  currentRepo: RepoState | null;
  recentRepos: string[];
  isLoading: boolean;
  error: string | null;
  setCurrentRepo: (repo: RepoState | null) => void;
  addRecentRepo: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRepo: () => void;
}

export const useRepoStore = create<RepoSlice>()(
  immer((set) => ({
    currentRepo: null,
    recentRepos: [],
    isLoading: false,
    error: null,

    setCurrentRepo: (repo) =>
      set((state) => {
        state.currentRepo = repo;
      }),

    addRecentRepo: (path) =>
      set((state) => {
        const filtered = state.recentRepos.filter((p: string) => p !== path);
        state.recentRepos = [path, ...filtered].slice(0, 10);
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    clearRepo: () =>
      set((state) => {
        state.currentRepo = null;
        state.error = null;
      }),
  }))
);
