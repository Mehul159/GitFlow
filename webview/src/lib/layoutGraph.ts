import dagre from "dagre";
import type { CommitRecord } from "../types";

const W = 200;
const H = 76;

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
    g.setNode(c.hash, { width: W, height: H });
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
      map.set(c.hash, { x: n.x - W / 2, y: n.y - H / 2 });
    }
  }
  return map;
}

export const NODE_W = W;
export const NODE_H = H;
