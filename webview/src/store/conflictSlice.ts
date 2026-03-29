import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ConflictFile, ConflictResolution } from "../types/git";
import type { ConflictSuggestion } from "../types/ai";

interface ConflictSlice {
  conflicts: ConflictFile[];
  resolutions: Record<string, ConflictResolution>;
  aiSuggestions: Record<string, ConflictSuggestion>;
  isResolving: boolean;
  mergeInProgress: boolean;
  setConflicts: (conflicts: ConflictFile[]) => void;
  setResolution: (path: string, resolution: ConflictResolution) => void;
  setAISuggestion: (path: string, suggestion: ConflictSuggestion) => void;
  acceptAISuggestion: (path: string) => Promise<void>;
  completeMerge: () => Promise<void>;
  abortMerge: () => void;
  clearConflicts: () => void;
}

export const useConflictStore = create<ConflictSlice>()(
  immer((set) => ({
    conflicts: [],
    resolutions: {},
    aiSuggestions: {},
    isResolving: false,
    mergeInProgress: false,

    setConflicts: (conflicts) =>
      set((state) => {
        state.conflicts = conflicts;
        state.mergeInProgress = conflicts.length > 0;
      }),

    setResolution: (path, resolution) =>
      set((state) => {
        state.resolutions[path] = resolution;
      }),

    setAISuggestion: (path, suggestion) =>
      set((state) => {
        state.aiSuggestions[path] = suggestion;
      }),

    acceptAISuggestion: async (path) => {
      const suggestion = get().aiSuggestions[path];
      if (!suggestion) return;

      set((state) => {
        state.resolutions[path] = {
          path,
          resolution: "mixed",
          content: suggestion.resolution,
        };
      });
    },

    completeMerge: async () => {
      set((state) => {
        state.isResolving = true;
      });
      // This will be implemented with git service
      set((state) => {
        state.isResolving = false;
        state.mergeInProgress = false;
        state.conflicts = [];
        state.resolutions = {};
      });
    },

    abortMerge: () =>
      set((state) => {
        state.conflicts = [];
        state.resolutions = {};
        state.mergeInProgress = false;
      }),

    clearConflicts: () =>
      set((state) => {
        state.conflicts = [];
        state.resolutions = {};
        state.aiSuggestions = {};
        state.mergeInProgress = false;
      }),
  }))
);

// Helper to access state in acceptAISuggestion
function get(): ConflictSlice {
  return useConflictStore.getState();
}
