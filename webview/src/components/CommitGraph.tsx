import { useCallback, useEffect, useMemo, type MouseEvent } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import type { GraphPayload } from "../types";
import { layoutCommitPositions, NODE_H, NODE_W } from "../lib/layoutGraph";
import { CommitNode, type CommitNodeData } from "./CommitNode";

function EmptyRootNode() {
  return (
    <div className="w-[min(92vw,280px)] rounded-gfs border-2 border-dashed border-gfs-accent/55 bg-gfs-surface/95 p-4 text-center shadow-node backdrop-blur-sm">
      <div className="text-sm font-semibold text-gfs-text">Start of history</div>
      <p className="mt-2 text-[11px] leading-relaxed text-gfs-muted">
        There are no commits yet, so there is no history line to draw. After your
        first commit, commits and branch links appear on this canvas.
      </p>
    </div>
  );
}

function localBranchNames(g: GraphPayload): string[] {
  const s = new Set<string>();
  if (g.branch) {
    s.add(g.branch);
  }
  for (const r of g.refs) {
    if (r.fullName.startsWith("refs/heads/")) {
      s.add(r.name);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function remoteBranchLabels(g: GraphPayload): string[] {
  const s = new Set<string>();
  for (const r of g.refs) {
    if (r.fullName.startsWith("refs/remotes/")) {
      s.add(r.name);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

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

function refsAt(hash: string, payload: GraphPayload): string[] {
  const labels: string[] = [];
  for (const r of payload.refs) {
    if (r.hash !== hash) {
      continue;
    }
    if (r.fullName.startsWith("refs/heads/")) {
      labels.push(r.name);
    } else if (r.fullName.startsWith("refs/remotes/")) {
      labels.push(`⎇ ${r.name}`);
    } else if (r.fullName.startsWith("refs/tags/")) {
      labels.push(r.name);
    }
  }
  return labels;
}

function buildFlow(
  graph: GraphPayload
): { nodes: Node<CommitNodeData>[]; edges: Edge[] } {
  const { commits, head } = graph;
  const pos = layoutCommitPositions(commits);
  const commitSet = new Set(commits.map((c) => c.hash));

  const nodes: Node<CommitNodeData>[] = commits.map((c) => {
    const labels = refsAt(c.hash, graph);
    const short = c.hash.slice(0, 7);
    const isHead = head === c.hash;
    return {
      id: c.hash,
      type: "commit",
      position: pos.get(c.hash) ?? { x: 0, y: 0 },
      data: {
        short,
        subject: c.subject,
        author: c.author,
        initials: initials(c.author),
        refs: labels,
        isHead,
      },
      width: NODE_W,
      height: NODE_H,
    };
  });

  const edges: Edge[] = [];
  for (const c of commits) {
    for (const p of c.parents) {
      if (!commitSet.has(p)) {
        continue;
      }
      edges.push({
        id: `${p}-${c.hash}`,
        source: p,
        target: c.hash,
        style: { stroke: "#2563EB", strokeWidth: 2, opacity: 0.88 },
      });
    }
  }

  return { nodes, edges };
}

const emptyNodeTypes = { emptyRoot: EmptyRootNode };

function EmptyRepoCanvas(props: { graph: GraphPayload }) {
  const locals = localBranchNames(props.graph);
  const remotes = remoteBranchLabels(props.graph);
  const initialNodes = useMemo(
    () =>
      [
        {
          id: "__gfs_empty_root__",
          type: "emptyRoot",
          position: { x: 0, y: 0 },
          data: {},
        },
      ] as Node[],
    []
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([] as Edge[]);

  return (
    <div className="h-full w-full min-h-[200px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={emptyNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(15, 23, 42, 0.85)"
          nodeColor={() => "#2563EB"}
        />
        <Panel
          position="top-center"
          className="!m-0 flex max-w-[95%] flex-col items-center gap-2"
        >
          {locals.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="w-full text-center text-[10px] font-semibold uppercase tracking-wider text-gfs-muted">
                Local branches
              </span>
              {locals.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-gfs-accent/20 px-2.5 py-1 font-mono text-[11px] font-medium text-gfs-accent ring-1 ring-gfs-accent/40"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}
          {remotes.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="w-full text-center text-[10px] font-semibold uppercase tracking-wider text-gfs-muted">
                Remote-tracking
              </span>
              {remotes.slice(0, 24).map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-gfs-surface2 px-2 py-0.5 font-mono text-[10px] text-gfs-muted ring-1 ring-gfs-surface2"
                >
                  {b}
                </span>
              ))}
              {remotes.length > 24 ? (
                <span className="text-[10px] text-gfs-muted">
                  +{remotes.length - 24} more
                </span>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </ReactFlow>
    </div>
  );
}

function NoRepoPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-lg font-semibold text-gfs-text">No graph yet</div>
      <p className="max-w-xs text-sm text-gfs-muted">
        Open a Git repository in this workspace. Commits appear here as an
        interactive canvas: pan, zoom, and explore history without leaving VS
        Code. Shift-click two commits to diff them.
      </p>
    </div>
  );
}

function CommitGraphFilled(props: {
  graph: GraphPayload;
  selected: string | null;
  onSelect: (hash: string | null) => void;
  onShiftClickCommit?: (hash: string) => void;
}) {
  const initial = useMemo(() => buildFlow(props.graph), [props.graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: n.id === props.selected }))
    );
  }, [props.selected, setNodes]);

  const onNodeClick = useCallback(
    (ev: MouseEvent, n: Node) => {
      if (ev.shiftKey && props.onShiftClickCommit) {
        props.onShiftClickCommit(n.id);
        return;
      }
      props.onSelect(n.id);
    },
    [props]
  );

  const onPaneClick = useCallback(() => {
    props.onSelect(null);
  }, [props]);

  if (props.graph.commits.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-lg font-semibold text-gfs-text">
          No commits loaded
        </div>
        <p className="max-w-xs text-sm text-gfs-muted">
          Try Refresh. If this persists, check that Git is working in the
          integrated terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[200px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={{ commit: CommitNode }}
        fitView
        minZoom={0.15}
        maxZoom={1.85}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(15, 23, 42, 0.85)"
          nodeColor={() => "#2563EB"}
        />
      </ReactFlow>
    </div>
  );
}

export function CommitGraph(props: {
  graph: GraphPayload | null;
  selected: string | null;
  onSelect: (hash: string | null) => void;
  onShiftClickCommit?: (hash: string) => void;
}) {
  if (!props.graph) {
    return <NoRepoPlaceholder />;
  }

  if (props.graph.isEmptyRepo === true && props.graph.commits.length === 0) {
    return <EmptyRepoCanvas graph={props.graph} />;
  }

  return <CommitGraphFilled {...props} graph={props.graph} />;
}
