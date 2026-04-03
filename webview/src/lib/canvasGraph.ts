import type { Edge, Node } from "reactflow";
import type { CommitRecord, GraphPayload, RefRecord } from "../types";
import {
  BRANCH_H,
  COMMIT_H,
  COMMIT_W,
  assignCommitsToBranches,
  layoutCommitPositions,
} from "./layoutGraph";
import {
  FOLDER_LABEL,
  FOLDER_ORDER,
  type BranchFolderId,
  detectBranchFolder,
} from "./branchFolderDetect";

/** Distinct branch line colors (commit graph edges). */
export const BRANCH_LINE_COLORS = [
  "#2563EB",
  "#16A34A",
  "#D97706",
  "#9333EA",
  "#DB2777",
  "#0D9488",
  "#CA8A04",
  "#4F46E5",
  "#E11D48",
  "#059669",
];

export type CanvasViewMode = "commitGraph" | "branchTree";

const STALE_MS = 30 * 24 * 60 * 60 * 1000;

function findAncestorsSet(
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

function countCommitsOnBranch(
  commits: CommitRecord[],
  tipHash: string
): number {
  if (!commits.some((c) => c.hash === tipHash)) {
    return 0;
  }
  const anc = findAncestorsSet(commits, tipHash);
  return commits.filter((c) => anc.has(c.hash)).length;
}

function remoteBranchFolderKey(remoteShortName: string): string {
  const i = remoteShortName.indexOf("/");
  return i >= 0 ? remoteShortName.slice(i + 1) : remoteShortName;
}

function localHeadBranchRefs(refs: RefRecord[]): RefRecord[] {
  return refs.filter((r) => r.fullName.startsWith("refs/heads/"));
}

/**
 * Assign a stable color index to each local branch tip (sorted name).
 */
function branchColorIndex(refs: RefRecord[]): Map<string, number> {
  const heads = localHeadBranchRefs(refs)
    .filter((r) => r.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  const map = new Map<string, number>();
  heads.forEach((r, i) => {
    map.set(r.hash, i % BRANCH_LINE_COLORS.length);
  });
  return map;
}

/**
 * Paint commits by walking from each branch tip in sort order; first branch wins.
 */
function commitBranchColorIndex(
  commits: CommitRecord[],
  refs: RefRecord[],
  tipToColorIdx: Map<string, number>
): Map<string, number> {
  const commitMap = new Map(commits.map((c) => [c.hash, c]));
  const out = new Map<string, number>();

  const heads = localHeadBranchRefs(refs)
    .filter((r) => commitMap.has(r.hash))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visit = (hash: string, colorIdx: number) => {
    const stack = [hash];
    while (stack.length > 0) {
      const h = stack.pop()!;
      if (!commitMap.has(h)) continue;
      if (out.has(h)) continue;
      out.set(h, colorIdx);
      const c = commitMap.get(h)!;
      for (const p of c.parents) {
        if (commitMap.has(p) && !out.has(p)) {
          stack.push(p);
        }
      }
    }
  };

  for (const h of heads) {
    const idx = tipToColorIdx.get(h.hash) ?? 0;
    visit(h.hash, idx);
  }

  return out;
}

function refsDetailAt(hash: string, payload: GraphPayload): {
  tags: string[];
  branchLabels: string[];
  remoteLabels: string[];
} {
  const tags: string[] = [];
  const branchLabels: string[] = [];
  const remoteLabels: string[] = [];

  for (const r of payload.refs) {
    if (r.hash !== hash) continue;
    if (r.fullName.startsWith("refs/heads/")) {
      branchLabels.push(r.name);
    } else if (r.fullName.startsWith("refs/remotes/")) {
      remoteLabels.push(r.name);
    } else if (r.fullName.startsWith("refs/tags/")) {
      tags.push(r.name);
    }
  }
  return { tags, branchLabels, remoteLabels };
}

function isRemoteGhost(
  hash: string,
  payload: GraphPayload
): boolean {
  let hasHead = false;
  let hasRemote = false;
  for (const r of payload.refs) {
    if (r.hash !== hash) continue;
    if (r.fullName.startsWith("refs/heads/")) {
      hasHead = true;
      break;
    }
    if (r.fullName.startsWith("refs/remotes/")) {
      hasRemote = true;
    }
  }
  return !hasHead && hasRemote;
}

export type CommitNodePayload = {
  short: string;
  subject: string;
  author: string;
  initials: string;
  tags: string[];
  branchLabels: string[];
  remoteLabels: string[];
  isHead: boolean;
  isRemoteGhost: boolean;
};

export type BranchTreeCardData = {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  hash: string;
  commitCount: number;
  lastActivityMs: number;
  health: "good" | "warn" | "poor";
  stale: boolean;
  folder: BranchFolderId;
  folderLabel: string;
};

const FOLDER_W = 260;
const CARD_GAP_Y = 12;
const FOLDER_GAP_X = 48;
const COL_TOP = 40;

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length === 0) {
    return "?";
  }
  if (p.length === 1) {
    return p[0].slice(0, 2).toUpperCase();
  }
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** Commit graph: commits only, colored parent edges, ghost styling. */
export function buildCommitGraphFlow(
  graph: GraphPayload
): { nodes: Node[]; edges: Edge[] } {
  const { commits, refs, head } = graph;
  const commitSet = new Set(commits.map((c) => c.hash));

  const tipColors = branchColorIndex(refs);
  const commitColors = commitBranchColorIndex(commits, refs, tipColors);

  const positions =
    commits.length > 0
      ? layoutCommitPositions(commits)
      : new Map<string, { x: number; y: number }>();

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const c of commits) {
    const pos = positions.get(c.hash);
    if (!pos) continue;

    const { tags, branchLabels, remoteLabels } = refsDetailAt(c.hash, graph);
    const short = c.hash.slice(0, 7);
    const isHead = head === c.hash;
    const ghost = isRemoteGhost(c.hash, graph);

    nodes.push({
      id: c.hash,
      type: "commit",
      position: pos,
      data: {
        short,
        subject: c.subject,
        author: c.author,
        initials: initials(c.author),
        tags,
        branchLabels,
        remoteLabels,
        isHead,
        isRemoteGhost: ghost,
      } as CommitNodePayload,
      width: COMMIT_W,
      height: COMMIT_H,
    });
  }

  for (const c of commits) {
    for (const p of c.parents) {
      if (!commitSet.has(p)) {
        continue;
      }
      const ci = commitColors.get(c.hash);
      const stroke =
        ci !== undefined
          ? BRANCH_LINE_COLORS[ci % BRANCH_LINE_COLORS.length]
          : "#64748B";
      const childGhost = isRemoteGhost(c.hash, graph);
      const parentGhost = isRemoteGhost(p, graph);
      const dashed = childGhost || parentGhost;

      edges.push({
        id: `commit:${p}-${c.hash}`,
        source: p,
        target: c.hash,
        style: {
          stroke,
          strokeWidth: 2.5,
          opacity: dashed ? 0.75 : 0.92,
          strokeDasharray: dashed ? "6 4" : undefined,
        },
      });
    }
  }

  return { nodes, edges };
}

type LocalBranchRow = {
  kind: "local";
  name: string;
  hash: string;
  commitCount: number;
  lastMs: number;
  isCurrent: boolean;
  folder: BranchFolderId;
};

type RemoteBranchRow = {
  kind: "remote";
  name: string;
  hash: string;
  commitCount: number;
  lastMs: number;
  folder: BranchFolderId;
};

/** Branch tree: folder headers + branch cards, grouped and laid out in columns. */
export function buildBranchTreeFlow(
  graph: GraphPayload
): { nodes: Node[]; edges: Edge[] } {
  const { commits, refs, branch } = graph;
  const commitMap = new Map(commits.map((c) => [c.hash, c]));

  const branchData = assignCommitsToBranches(commits, refs, branch);

  const localTipHashes = new Set(
    branchData.map((b) => b.branch.hash)
  );

  const rows: (LocalBranchRow | RemoteBranchRow)[] = [];

  for (const bd of branchData) {
    const tipCommit = commitMap.get(bd.branch.hash);
    const lastMs = tipCommit ? tipCommit.date * 1000 : 0;
    rows.push({
      kind: "local",
      name: bd.branch.name,
      hash: bd.branch.hash,
      commitCount: bd.commits.length,
      lastMs,
      isCurrent: bd.isCurrentBranch,
      folder: detectBranchFolder(bd.branch.name),
    });
  }

  for (const r of refs) {
    if (!r.fullName.startsWith("refs/remotes/")) {
      continue;
    }
    if (!commitMap.has(r.hash)) {
      continue;
    }
    if (localTipHashes.has(r.hash)) {
      continue;
    }
    const key = remoteBranchFolderKey(r.name);
    rows.push({
      kind: "remote",
      name: r.name,
      hash: r.hash,
      commitCount: countCommitsOnBranch(commits, r.hash),
      lastMs: commitMap.has(r.hash) ? commitMap.get(r.hash)!.date * 1000 : 0,
      folder: detectBranchFolder(key),
    });
  }

  rows.sort((a, b) => {
    const fa = FOLDER_ORDER.indexOf(a.folder);
    const fb = FOLDER_ORDER.indexOf(b.folder);
    if (fa !== fb) {
      return fa - fb;
    }
    return a.name.localeCompare(b.name);
  });

  const byFolder = new Map<BranchFolderId, (LocalBranchRow | RemoteBranchRow)[]>();
  for (const id of FOLDER_ORDER) {
    byFolder.set(id, []);
  }
  for (const row of rows) {
    byFolder.get(row.folder)!.push(row);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const now = Date.now();

  let col = 0;
  for (const folderId of FOLDER_ORDER) {
    const list = byFolder.get(folderId)!;
    if (list.length === 0) continue;

    const x = col * (FOLDER_W + FOLDER_GAP_X);
    let y = COL_TOP;

    for (const row of list) {
      const stale = row.lastMs > 0 && now - row.lastMs > STALE_MS;
      let health: "good" | "warn" | "poor" = "good";
      if (row.commitCount === 0) {
        health = "poor";
      } else if (stale) {
        health = "warn";
      }

      const id =
        row.kind === "local"
          ? `branch:${row.name}`
          : `branch-remote:${row.name}`;

      nodes.push({
        id,
        type: "branchTreeCard",
        position: { x, y },
        data: {
          name: row.name,
          isRemote: row.kind === "remote",
          isCurrent: row.kind === "local" ? row.isCurrent : false,
          hash: row.hash,
          commitCount: row.commitCount,
          lastActivityMs: row.lastMs,
          health,
          stale,
          folder: folderId,
          folderLabel: FOLDER_LABEL[folderId],
        } as BranchTreeCardData,
        width: FOLDER_W,
        height: BRANCH_H,
        draggable: true,
      });

      y += BRANCH_H + CARD_GAP_Y;
    }

    col += 1;
  }

  if (nodes.length === 0) {
    nodes.push({
      id: "__branch_tree_empty__",
      type: "branchTreeCard",
      position: { x: 40, y: 40 },
      data: {
        name: "No branches in graph",
        isRemote: false,
        isCurrent: false,
        hash: "",
        commitCount: 0,
        lastActivityMs: 0,
        health: "poor",
        stale: false,
        folder: "other",
        folderLabel: "Other",
      } as BranchTreeCardData,
      width: FOLDER_W,
      height: BRANCH_H,
    });
  }

  return { nodes, edges };
}
