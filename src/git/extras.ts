import * as fs from "fs";
import * as path from "path";
import { execGit } from "./execGit";

export interface StashRow {
  id: string;
  index: number;
  hash: string;
  subject: string;
}

export interface RemoteRow {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface TagRow {
  name: string;
  hash: string;
  subject: string;
}

export interface ReflogRow {
  hash: string;
  ref: string;
  subject: string;
  date: number;
}

export interface SubmoduleRow {
  path: string;
  url: string;
  sha: string;
}

export interface WorktreeRow {
  path: string;
  head: string;
  branch: string;
}

export interface MergeState {
  merging: boolean;
  rebasing: boolean;
  cherryPick: boolean;
  revert: boolean;
  conflictFiles: string[];
}

export interface AheadBehind {
  upstream: string | null;
  ahead: number;
  behind: number;
}

export interface GitUserConfig {
  userName: string;
  userEmail: string;
}

export interface RepoExtrasPayload {
  stash: StashRow[];
  remotes: RemoteRow[];
  tags: TagRow[];
  reflog: ReflogRow[];
  mergeState: MergeState;
  submodules: SubmoduleRow[];
  worktrees: WorktreeRow[];
  config: GitUserConfig;
  aheadBehind: AheadBehind | null;
}

async function gitDir(repoRoot: string): Promise<string> {
  const g = (await execGit(repoRoot, ["rev-parse", "--git-dir"])).trim();
  if (path.isAbsolute(g)) {
    return g;
  }
  return path.join(repoRoot, g);
}

export async function loadMergeState(repoRoot: string): Promise<MergeState> {
  const gd = await gitDir(repoRoot);
  const merging = fs.existsSync(path.join(gd, "MERGE_HEAD"));
  const rebasing =
    fs.existsSync(path.join(gd, "rebase-merge")) ||
    fs.existsSync(path.join(gd, "rebase-apply"));
  const cherryPick = fs.existsSync(path.join(gd, "CHERRY_PICK_HEAD"));
  const revert = fs.existsSync(path.join(gd, "REVERT_HEAD"));
  let conflictFiles: string[] = [];
  try {
    const u = await execGit(repoRoot, [
      "diff",
      "--name-only",
      "--diff-filter=U",
    ]);
    conflictFiles = u
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    conflictFiles = [];
  }
  return {
    merging,
    rebasing,
    cherryPick,
    revert,
    conflictFiles,
  };
}

export async function loadStashes(repoRoot: string): Promise<StashRow[]> {
  let out: string;
  try {
    out = await execGit(repoRoot, [
      "stash",
      "list",
      "--format=%gd\t%h\t%s",
    ]);
  } catch {
    return [];
  }
  const rows: StashRow[] = [];
  for (const line of out.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const parts = t.split("\t");
    if (parts.length < 3) {
      continue;
    }
    const id = parts[0];
    const m = /^stash@\{(\d+)\}$/.exec(id);
    const index = m ? Number(m[1]) : rows.length;
    rows.push({
      id,
      index,
      hash: parts[1],
      subject: parts.slice(2).join("\t"),
    });
  }
  return rows;
}

export async function loadRemotes(repoRoot: string): Promise<RemoteRow[]> {
  const out = await execGit(repoRoot, ["remote", "-v"]);
  const map = new Map<string, { fetch?: string; push?: string }>();
  for (const line of out.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const m = /^(\S+)\s+(\S+)\s+\((fetch|push)\)$/.exec(t);
    if (!m) {
      continue;
    }
    const name = m[1];
    const url = m[2];
    const kind = m[3];
    const cur = map.get(name) ?? {};
    if (kind === "fetch") {
      cur.fetch = url;
    } else {
      cur.push = url;
    }
    map.set(name, cur);
  }
  return [...map.entries()].map(([name, u]) => ({
    name,
    fetchUrl: u.fetch ?? "",
    pushUrl: u.push ?? u.fetch ?? "",
  }));
}

export async function loadTags(repoRoot: string): Promise<TagRow[]> {
  const out = await execGit(repoRoot, [
    "for-each-ref",
    "--sort=-creatordate",
    "--count=80",
    "refs/tags",
    "--format=%(objectname)\t%(refname:short)\t%(contents:subject)",
  ]);
  const rows: TagRow[] = [];
  for (const line of out.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const parts = t.split("\t");
    if (parts.length < 2) {
      continue;
    }
    rows.push({
      hash: parts[0],
      name: parts[1].replace(/^refs\/tags\//, ""),
      subject: parts.slice(2).join("\t"),
    });
  }
  return rows;
}

export async function loadReflog(repoRoot: string): Promise<ReflogRow[]> {
  try {
    const out = await execGit(repoRoot, [
      "reflog",
      "-n",
      "60",
      "--format=%h\t%gd\t%gs\t%ct",
    ]);
    const rows: ReflogRow[] = [];
    for (const line of out.split("\n")) {
      const t = line.trim();
      if (!t) {
        continue;
      }
      const parts = t.split("\t");
      if (parts.length < 4) {
        continue;
      }
      const ct = parts[parts.length - 1];
      const gs = parts.slice(2, -1).join("\t");
      rows.push({
        hash: parts[0],
        ref: parts[1],
        subject: gs,
        date: Number(ct) || 0,
      });
    }
    return rows;
  } catch {
    /* e.g. unborn branch: "fatal: ... does not have any commits yet" */
    return [];
  }
}

export async function loadSubmodules(
  repoRoot: string
): Promise<SubmoduleRow[]> {
  let out: string;
  try {
    out = await execGit(repoRoot, ["submodule", "status"]);
  } catch {
    return [];
  }
  const rows: SubmoduleRow[] = [];
  for (const line of out.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const m = /^[ +-U]([0-9a-f]+)\s+(\S+)(?:\s+\(([^)]*)\))?/.exec(t);
    if (!m) {
      continue;
    }
    rows.push({ path: m[2], sha: m[1], url: m[3] ?? "" });
  }
  return rows;
}

export async function loadWorktrees(repoRoot: string): Promise<WorktreeRow[]> {
  let out: string;
  try {
    out = await execGit(repoRoot, ["worktree", "list", "--porcelain"]);
  } catch {
    return [];
  }
  const rows: WorktreeRow[] = [];
  let cur: Partial<WorktreeRow> = {};
  for (const line of out.split("\n")) {
    if (line === "" && cur.path) {
      rows.push({
        path: cur.path,
        head: cur.head ?? "",
        branch: cur.branch ?? "",
      });
      cur = {};
      continue;
    }
    if (line.startsWith("worktree ")) {
      cur.path = line.slice("worktree ".length).trim();
    } else if (line.startsWith("HEAD ")) {
      cur.head = line.slice("HEAD ".length).trim();
    } else if (line.startsWith("branch ")) {
      const ref = line.slice("branch ".length).trim();
      cur.branch = ref.replace("refs/heads/", "");
    }
  }
  if (cur.path) {
    rows.push({
      path: cur.path,
      head: cur.head ?? "",
      branch: cur.branch ?? "",
    });
  }
  return rows;
}

export async function loadGitConfig(
  repoRoot: string
): Promise<GitUserConfig> {
  let userName = "";
  let userEmail = "";
  try {
    userName = (await execGit(repoRoot, ["config", "user.name"])).trim();
  } catch {
    userName = "";
  }
  try {
    userEmail = (await execGit(repoRoot, ["config", "user.email"])).trim();
  } catch {
    userEmail = "";
  }
  return { userName, userEmail };
}

export async function loadAheadBehind(
  repoRoot: string
): Promise<AheadBehind | null> {
  try {
    const up = (
      await execGit(repoRoot, ["rev-parse", "--abbrev-ref", "@{upstream}"])
    ).trim();
    if (!up || up === "@{upstream}") {
      return null;
    }
    const counts = (
      await execGit(repoRoot, [
        "rev-list",
        "--left-right",
        "--count",
        "HEAD...@{upstream}",
      ])
    )
      .trim()
      .split(/\s+/);
    if (counts.length < 2) {
      return { upstream: up, ahead: 0, behind: 0 };
    }
    return {
      upstream: up,
      ahead: Number(counts[0]) || 0,
      behind: Number(counts[1]) || 0,
    };
  } catch {
    return null;
  }
}

async function safeExtra<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function loadRepoExtras(
  repoRoot: string
): Promise<RepoExtrasPayload> {
  const emptyMerge: MergeState = {
    merging: false,
    rebasing: false,
    cherryPick: false,
    revert: false,
    conflictFiles: [],
  };
  const emptyConfig: GitUserConfig = { userName: "", userEmail: "" };

  const [
    stash,
    remotes,
    tags,
    reflog,
    mergeState,
    submodules,
    worktrees,
    config,
    aheadBehind,
  ] = await Promise.all([
    safeExtra(() => loadStashes(repoRoot), []),
    safeExtra(() => loadRemotes(repoRoot), []),
    safeExtra(() => loadTags(repoRoot), []),
    safeExtra(() => loadReflog(repoRoot), []),
    safeExtra(() => loadMergeState(repoRoot), emptyMerge),
    safeExtra(() => loadSubmodules(repoRoot), []),
    safeExtra(() => loadWorktrees(repoRoot), []),
    safeExtra(() => loadGitConfig(repoRoot), emptyConfig),
    safeExtra(() => loadAheadBehind(repoRoot), null),
  ]);
  return {
    stash,
    remotes,
    tags,
    reflog,
    mergeState,
    submodules,
    worktrees,
    config,
    aheadBehind,
  };
}
