import dagre from "dagre";
import type { CommitRecord, RefRecord } from "../types";

export const BRANCH_H = 72;
export const COMMIT_W = 200;
export const COMMIT_H = 76;

interface BranchWithCommits {
  branch: RefRecord;
  commits: CommitRecord[];
  isCurrentBranch: boolean;
}

function findAncestors(
  commits: CommitRecord[],
  commitHash: string
): Set<string> {
  const ancestors = new Set<string>();
  const queue = [commitHash];
  const commitMap = new Map(commits.map((c) => [c.hash, c]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ancestors.has(current)) continue;
    ancestors.add(current);

    const commit = commitMap.get(current);
    if (commit) {
      for (const parent of commit.parents) {
        if (!ancestors.has(parent)) {
          queue.push(parent);
        }
      }
    }
  }

  return ancestors;
}

export function assignCommitsToBranches(
  commits: CommitRecord[],
  refs: RefRecord[],
  currentBranch: string | null
): BranchWithCommits[] {
  const commitMap = new Map(commits.map((c) => [c.hash, c]));

  const allBranchRefs = refs.filter((r) => r.fullName.startsWith("refs/heads/"));

  if (allBranchRefs.length === 0) {
    return [];
  }

  const branchTips = allBranchRefs
    .filter((ref) => commitMap.has(ref.hash))
    .map((ref) => ({ branch: ref, hash: ref.hash }));

  const branchCommits = new Map<string, CommitRecord[]>();
  for (const ref of allBranchRefs) {
    branchCommits.set(ref.hash, []);
  }

  if (branchTips.length > 0) {
    const allAncestors = branchTips.map((bt) => findAncestors(commits, bt.hash));

    for (const commit of commits) {
      const containingBranches: string[] = [];
      for (let i = 0; i < branchTips.length; i++) {
        if (allAncestors[i].has(commit.hash)) {
          containingBranches.push(branchTips[i].hash);
        }
      }

      if (containingBranches.length === 1) {
        branchCommits.get(containingBranches[0])!.push(commit);
      }
    }
  }

  const result: BranchWithCommits[] = [];
  for (const ref of allBranchRefs) {
    const commitsList = branchCommits.get(ref.hash) || [];
    commitsList.sort((a, b) => b.date - a.date);
    result.push({
      branch: ref,
      commits: commitsList,
      isCurrentBranch: ref.name === currentBranch,
    });
  }

  return result;
}

export function layoutCommitPositions(
  commits: CommitRecord[]
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 48,
    ranksep: 88,
    marginx: 28,
    marginy: 28,
  });

  const set = new Set(commits.map((c) => c.hash));
  for (const c of commits) {
    g.setNode(c.hash, { width: COMMIT_W, height: COMMIT_H });
  }
  for (const c of commits) {
    for (const p of c.parents) {
      if (set.has(p)) {
        g.setEdge(p, c.hash);
      }
    }
  }
  dagre.layout(g);

  const map = new Map<string, { x: number; y: number }>();
  for (const c of commits) {
    const n = g.node(c.hash);
    if (n) {
      map.set(c.hash, { x: n.x - COMMIT_W / 2, y: n.y - COMMIT_H / 2 });
    }
  }
  return map;
}

export const NODE_W = COMMIT_W;
export const NODE_H = COMMIT_H;
