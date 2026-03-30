import type { RepoExtrasPayload } from "./git/extras";

export type WebviewToHost =
  | { type: "ready" }
  | { type: "refresh" }
  | { type: "openSettings" }
  | { type: "openGitSettings" }
  | { type: "initRepo" }
  | { type: "cloneRepo"; url: string }
  | { type: "checkout"; branch: string }
  | { type: "checkoutRemote"; name: string }
  | { type: "branchCreate"; name: string; startPoint?: string; checkout?: boolean }
  | { type: "branchDelete"; name: string; force?: boolean }
  | { type: "branchRename"; oldName: string; newName: string }
  | { type: "stage"; paths: string[] }
  | { type: "unstage"; paths: string[] }
  | { type: "stageAll" }
  | { type: "discard"; paths: string[] }
  | { type: "removeFromIndex"; paths: string[] }
  | {
      type: "commit";
      message: string;
      amend?: boolean;
      allTracked?: boolean;
    }
  | { type: "suggestCommit" }
  | { type: "fetch"; remote?: string }
  | { type: "pull"; remote?: string; branch?: string; rebase?: boolean }
  | {
      type: "push";
      remote?: string;
      branch?: string;
      force?: boolean;
      tags?: boolean;
    }
  | {
      type: "pushSetUpstream";
      remote?: string;
      branch?: string;
      force?: boolean;
    }
  | { type: "merge"; branch: string; squash?: boolean; noFf?: boolean }
  | {
      type: "mergeBranches";
      into: string;
      from: string;
      squash?: boolean;
      noFf?: boolean;
    }
  | { type: "mergeAbort" }
  | { type: "rebase"; onto: string }
  | { type: "rebaseAbort" }
  | { type: "cherryPick"; hash: string }
  | { type: "cherryPickAbort" }
  | { type: "reset"; mode: "soft" | "mixed" | "hard"; ref: string }
  | { type: "stashPush"; message?: string }
  | { type: "stashPop"; index: number }
  | { type: "stashApply"; index: number }
  | { type: "stashDrop"; index: number }
  | { type: "stashClear" }
  | { type: "stashBranch"; index: number; branch: string }
  | {
      type: "tagCreate";
      name: string;
      message?: string;
      annotated?: boolean;
      hash?: string;
    }
  | { type: "tagDelete"; name: string }
  | { type: "remoteAdd"; name: string; url: string }
  | { type: "remoteRemove"; name: string }
  | { type: "gitConfigSet"; key: "user.name" | "user.email"; value: string }
  | { type: "submoduleUpdate"; init?: boolean }
  | { type: "clean"; dirs?: boolean }
  | { type: "cleanPreview" }
  | { type: "gc" }
  | { type: "fsck" }
  | { type: "bisectStart" }
  | { type: "bisectGood"; ref?: string }
  | { type: "bisectBad"; ref?: string }
  | { type: "bisectReset" }
  | { type: "noteAdd"; hash: string; message: string }
  | { type: "getDiff"; path?: string; staged?: boolean; from?: string; to?: string }
  | { type: "getShow"; hash: string }
  | { type: "getBlame"; path: string }
  | { type: "getShortlog" }
  | { type: "openInEditor"; path: string }
  | { type: "openExternalUrl"; url: string };

export type HostToWebview =
  | { type: "graph"; payload: unknown; error?: string }
  | { type: "status"; payload: unknown; error?: string }
  | {
      type: "extras";
      payload: RepoExtrasPayload | null;
      error?: string;
    }
  | { type: "suggestResult"; message: string; error?: string }
  | { type: "toast"; level: "info" | "error"; message: string }
  | { type: "config"; geminiConfigured: boolean; groqConfigured: boolean }
  | { type: "hostRefresh" }
  | { type: "openCommandPalette" }
  | {
      type: "textDocument";
      title: string;
      body: string;
      language?: string;
    }
  | {
      type: "pushNoUpstream";
      branch: string;
      remote: string;
    }
  | {
      type: "mergeResult";
      status: "ok" | "conflict" | "error";
      message?: string;
      conflictFiles?: string[];
    };
