import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { StashRow } from "../types/git";

interface StashSlice {
  stashes: StashRow[];
  isLoading: boolean;
  setStashes: (stashes: StashRow[]) => void;
  addStash: (stash: StashRow) => void;
  removeStash: (index: number) => void;
  setLoading: (loading: boolean) => void;
  clearStashes: () => void;
}

export const useStashStore = create<StashSlice>()(
  immer((set) => ({
    stashes: [],
    isLoading: false,

    setStashes: (stashes) =>
      set((state) => {
        state.stashes = stashes;
      }),

    addStash: (stash) =>
      set((state) => {
        state.stashes.unshift(stash);
      }),

    removeStash: (index) =>
      set((state) => {
        state.stashes = state.stashes.filter((s: StashRow) => s.index !== index);
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    clearStashes: () =>
      set((state) => {
        state.stashes = [];
      }),
  }))
);
