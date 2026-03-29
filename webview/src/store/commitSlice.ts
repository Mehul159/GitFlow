import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CommitRecord } from "../types/git";

interface CommitSlice {
  commits: CommitRecord[];
  totalCount: number;
  loadedCount: number;
  isLoading: boolean;
  hasMore: boolean;
  selectedCommit: string | null;
  pageSize: number;
  setCommits: (commits: CommitRecord[], total?: number) => void;
  appendCommits: (commits: CommitRecord[]) => void;
  setSelectedCommit: (sha: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  clearCommits: () => void;
  refreshCommits: () => Promise<void>;
}

export const useCommitStore = create<CommitSlice>()(
  immer((set) => ({
    commits: [],
    totalCount: 0,
    loadedCount: 0,
    isLoading: false,
    hasMore: true,
    selectedCommit: null,
    pageSize: 100,

    setCommits: (commits, total) =>
      set((state) => {
        state.commits = commits;
        state.loadedCount = commits.length;
        state.totalCount = total ?? commits.length;
        state.hasMore = commits.length < (total ?? commits.length);
      }),

    appendCommits: (newCommits) =>
      set((state) => {
        const existing = new Set(state.commits.map((c: CommitRecord) => c.hash));
        const unique = newCommits.filter((c: CommitRecord) => !existing.has(c.hash));
        state.commits = [...state.commits, ...unique];
        state.loadedCount = state.commits.length;
        state.hasMore = state.loadedCount < state.totalCount;
      }),

    setSelectedCommit: (sha) =>
      set((state) => {
        state.selectedCommit = sha;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setHasMore: (hasMore) =>
      set((state) => {
        state.hasMore = hasMore;
      }),

    clearCommits: () =>
      set((state) => {
        state.commits = [];
        state.loadedCount = 0;
        state.totalCount = 0;
        state.hasMore = true;
        state.selectedCommit = null;
      }),

    refreshCommits: async () => {
      set((state) => {
        state.isLoading = true;
        state.commits = [];
        state.loadedCount = 0;
      });
      // This will be implemented with the git service
      // For now, just reset loading state
      set((state) => {
        state.isLoading = false;
      });
    },
  }))
);
