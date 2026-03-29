import { useRepoStore } from "./repoSlice";
import { useBranchStore } from "./branchSlice";
import { useCommitStore } from "./commitSlice";
import { useAIStore } from "./aiSlice";
import { useUIStore } from "./uiSlice";
import { useConflictStore } from "./conflictSlice";
import { useStashStore } from "./stashSlice";

export {
  useRepoStore,
  useBranchStore,
  useCommitStore,
  useAIStore,
  useUIStore,
  useConflictStore,
  useStashStore,
};

export interface AppState {
  repo: typeof useRepoStore;
  branch: typeof useBranchStore;
  commit: typeof useCommitStore;
  ai: typeof useAIStore;
  ui: typeof useUIStore;
  conflict: typeof useConflictStore;
  stash: typeof useStashStore;
}

export const useAppStore = (): AppState => ({
  repo: useRepoStore,
  branch: useBranchStore,
  commit: useCommitStore,
  ai: useAIStore,
  ui: useUIStore,
  conflict: useConflictStore,
  stash: useStashStore,
});
