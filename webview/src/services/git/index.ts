import type { CommitRecord, Branch, FileStatusRow, RepoState } from "../../types/git";

interface GitCommit {
  oid: string;
  commit: {
    parent: string[];
    message: string;
    author: {
      name: string;
      email: string;
      timestamp: number;
    };
  };
}

let gitWorker: Worker | null = null;
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}>();

function getWorker(): Worker {
  if (!gitWorker) {
    gitWorker = new Worker(
      new URL("../../workers/gitWorker.ts", import.meta.url),
      { type: "module" }
    );

    gitWorker.onmessage = (event) => {
      const { id, success, data, error } = event.data;
      const pending = pendingRequests.get(id);
      if (!pending) return;

      if (success) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error || "Unknown error"));
      }
      pendingRequests.delete(id);
    };
  }
  return gitWorker;
}

function callGit<T>(method: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });

    const worker = getWorker();
    worker.postMessage({ id, method, args });
  });
}

export async function getLog(
  repoPath: string,
  options: { depth?: number; since?: string } = {}
): Promise<CommitRecord[]> {
  const commits = await callGit<GitCommit[]>("log", repoPath, {}, options);
  
  return commits.map((c) => ({
    hash: c.oid,
    parents: c.commit.parent,
    subject: c.commit.message,
    author: c.commit.author.name,
    email: c.commit.author.email,
    date: c.commit.author.timestamp * 1000,
    decoration: "",
  }));
}

export async function getStatus(repoPath: string): Promise<{
  staged: FileStatusRow[];
  unstaged: FileStatusRow[];
  untracked: string[];
}> {
  const matrix = await callGit<[string, number, number][]>("status", repoPath);

  const staged: FileStatusRow[] = [];
  const unstaged: FileStatusRow[] = [];
  const untracked: string[] = [];

  for (const [filepath, headStatus, workTreeStatus] of matrix) {
    const stagedChar = getStatusChar(headStatus);
    const unstagedChar = getStatusChar(workTreeStatus);

    if (headStatus === 0 && workTreeStatus === 0) continue;
    if (headStatus === 0 && workTreeStatus === 2) {
      untracked.push(filepath);
      continue;
    }

    const row: FileStatusRow = {
      path: filepath,
      staged: stagedChar,
      unstaged: unstagedChar,
      display: filepath.split("/").pop() || filepath,
    };

    if (headStatus !== 0) {
      staged.push(row);
    }
    if (workTreeStatus !== 0) {
      unstaged.push(row);
    }
  }

  return { staged, unstaged, untracked };
}

function getStatusChar(status: number): string {
  switch (status) {
    case 1: return "N";
    case 2: return "M";
    case 3: return "D";
    case 4: return "A";
    case 5: return "?";
    case 6: return "U";
    default: return "·";
  }
}

export async function listBranches(repoPath: string): Promise<Branch[]> {
  const branches = await callGit<string[]>("branch", repoPath);
  const currentBranch = await callGit<string | null>("currentBranch", repoPath);

  return branches.map((name) => ({
    name,
    fullName: `refs/heads/${name}`,
    isRemote: false,
    isCurrent: name === currentBranch,
  }));
}

export async function createBranch(
  repoPath: string,
  name: string,
  startPoint?: string
): Promise<void> {
  await callGit("branchCreate", repoPath, { name, startPoint });
}

export async function deleteBranch(repoPath: string, name: string): Promise<void> {
  await callGit("branchDelete", repoPath, name);
}

export async function switchBranch(repoPath: string, name: string): Promise<void> {
  await callGit("checkout", repoPath, name);
}

export async function commit(
  repoPath: string,
  message: string,
  author?: { name: string; email: string }
): Promise<string> {
  return callGit<string>("commit", repoPath, { message, author });
}

export async function stageFile(repoPath: string, filepath: string): Promise<void> {
  await callGit("add", repoPath, filepath);
}

export async function stageAll(repoPath: string): Promise<void> {
  await callGit("add", repoPath, ".");
}

export async function unstageFile(repoPath: string, filepath: string): Promise<void> {
  await callGit("reset", repoPath, filepath);
}

export async function merge(
  repoPath: string,
  theirs: string,
  message?: string
): Promise<string> {
  return callGit<string>("merge", repoPath, { theirs, message });
}

export async function fetchRemote(
  repoPath: string,
  remote?: string,
  url?: string
): Promise<void> {
  await callGit("fetch", repoPath, { remote, url });
}

export async function push(
  repoPath: string,
  options: { remote?: string; ref?: string; force?: boolean } = {}
): Promise<void> {
  await callGit("push", repoPath, options);
}

export async function pull(
  repoPath: string,
  options: { remote?: string; branch?: string } = {}
): Promise<void> {
  await callGit("pull", repoPath, options);
}

export async function createTag(
  repoPath: string,
  name: string,
  message?: string,
  sha?: string
): Promise<void> {
  await callGit("tag", repoPath, { name, message, sha });
}

export async function deleteTag(repoPath: string, name: string): Promise<void> {
  await callGit("deleteTag", repoPath, name);
}

export async function listRemotes(repoPath: string): Promise<{ name: string; url: string }[]> {
  return callGit<{ name: string; url: string }[]>("remote", repoPath);
}

export async function addRemote(repoPath: string, name: string, url: string): Promise<void> {
  await callGit("addRemote", repoPath, { name, url });
}

export async function removeRemote(repoPath: string, name: string): Promise<void> {
  await callGit("removeRemote", repoPath, name);
}

export async function initRepo(repoPath: string): Promise<RepoState> {
  await callGit("init", repoPath);

  return {
    path: repoPath,
    root: repoPath,
    branch: "main",
    head: null,
    isBare: false,
    remotes: [],
  };
}

export function terminateWorker(): void {
  if (gitWorker) {
    gitWorker.terminate();
    gitWorker = null;
  }
}
