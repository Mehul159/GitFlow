import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnectStartParams,
} from "reactflow";
import "reactflow/dist/style.css";

import type { GraphPayload } from "../types";
import {
  buildBranchTreeFlow,
  buildCommitGraphFlow,
  type BranchTreeCardData,
  type CanvasViewMode,
} from "../lib/canvasGraph";
import { BranchTreeCardNode } from "./BranchTreeCardNode";
import { CommitNode } from "./CommitNode";

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

function LoadingPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gfs-accent border-t-transparent" />
        <div className="text-sm font-medium text-gfs-muted">Loading repository…</div>
      </div>
      <div className="flex gap-3 opacity-30">
        <div className="h-12 w-36 animate-pulse rounded-lg bg-gfs-surface2" />
        <div className="h-12 w-36 animate-pulse rounded-lg bg-gfs-surface2 delay-75" />
        <div className="h-12 w-36 animate-pulse rounded-lg bg-gfs-surface2 delay-150" />
      </div>
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

const commitGraphNodeTypes = {
  commit: CommitNode,
};

const branchTreeNodeTypes = {
  branchTreeCard: BranchTreeCardNode,
};

function FitViewOnDataChange(props: { sig: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = window.setTimeout(() => {
      fitView({ padding: 0.25, duration: 380 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [props.sig, fitView]);
  return null;
}

function GraphCanvasBody(props: {
  graph: GraphPayload;
  view: CanvasViewMode;
  selected: string | null;
  onSelect: (hash: string | null) => void;
  onShiftClickCommit?: (hash: string) => void;
  onBranchMergeRequest?: (p: {
    from: string;
    into: string;
    fromRemote: boolean;
    intoRemote: boolean;
  }) => void;
  api?: { postMessage: (m: unknown) => void } | null;
}) {
  const connectStartRef = useRef<{ nodeId: string; handleType: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; hash: string } | null>(null);

  const flow = useMemo(() => {
    return props.view === "commitGraph"
      ? buildCommitGraphFlow(props.graph)
      : buildBranchTreeFlow(props.graph);
  }, [props.graph, props.view]);

  const searchMatchIds = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || props.view !== "commitGraph") return null;
    const hits = new Set<string>();
    for (const c of props.graph.commits) {
      if (
        c.hash.toLowerCase().startsWith(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q)
      ) {
        hits.add(c.hash);
      }
    }
    if (hits.size === 0) return "empty" as const;
    return hits;
  }, [searchTerm, props.graph.commits, props.view]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => {
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [flow, setNodes, setEdges]);

  const fitSig = `${props.view}|${flow.nodes.length}|${flow.edges.length}`;

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const dimmed =
          searchMatchIds !== null &&
          searchMatchIds !== "empty" &&
          !searchMatchIds.has(n.id);
        if (props.view === "commitGraph") {
          return {
            ...n,
            selected: n.id === props.selected,
            style: dimmed ? { opacity: 0.25 } : undefined,
          };
        }
        const tip =
          typeof n.data === "object" &&
          n.data &&
          "hash" in n.data &&
          typeof (n.data as { hash?: string }).hash === "string"
            ? (n.data as { hash: string }).hash
            : null;
        const sel = tip && tip === props.selected;
        return { ...n, selected: Boolean(sel) };
      })
    );
  }, [props.selected, props.view, setNodes, searchMatchIds]);

  const getNodeColor = useCallback(
    (n: Node) => {
      if (n.type === "branchTreeCard") {
        return "#22C55E";
      }
      return "#2563EB";
    },
    []
  );

  const onNodeClick = useCallback(
    (ev: MouseEvent, n: Node) => {
      if (props.view === "branchTree") {
        if (n.type === "branchTreeCard" && n.data && typeof n.data === "object") {
          const h = (n.data as { hash?: string }).hash;
          if (h) {
            props.onSelect(h);
            return;
          }
        }
        props.onSelect(null);
        return;
      }
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
    setCtxMenu(null);
  }, [props]);

  const onNodeContextMenu = useCallback(
    (event: MouseEvent, n: Node) => {
      if (props.view !== "commitGraph") return;
      event.preventDefault();
      setCtxMenu({ x: event.clientX, y: event.clientY, hash: n.id });
    },
    [props.view]
  );

  const isValidConnection = useCallback(
    (edge: Connection) => {
      if (!edge.source || !edge.target || edge.source === edge.target) {
        return false;
      }
      const s = nodes.find((n) => n.id === edge.source);
      const t = nodes.find((n) => n.id === edge.target);
      if (!s || !t || s.type !== "branchTreeCard" || t.type !== "branchTreeCard") {
        return false;
      }
      const sd = s.data as BranchTreeCardData;
      const td = t.data as BranchTreeCardData;
      if (!sd.hash?.trim() || !td.hash?.trim()) {
        return false;
      }
      if (td.isRemote) {
        return false;
      }
      return true;
    },
    [nodes]
  );

  const onConnectStart = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
      if (params.nodeId && params.handleType) {
        connectStartRef.current = {
          nodeId: params.nodeId,
          handleType: params.handleType,
        };
      }
    },
    []
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !props.onBranchMergeRequest) {
        return;
      }

      const dragOriginNodeId = connectStartRef.current?.nodeId ?? null;
      connectStartRef.current = null;

      const sourceNode = nodes.find((n) => n.id === c.source);
      const targetNode = nodes.find((n) => n.id === c.target);
      if (!sourceNode || !targetNode) {
        return;
      }
      const sourceData = sourceNode.data as BranchTreeCardData;
      const targetData = targetNode.data as BranchTreeCardData;

      let fromData: BranchTreeCardData;
      let intoData: BranchTreeCardData;

      if (dragOriginNodeId === c.target) {
        fromData = targetData;
        intoData = sourceData;
      } else {
        fromData = sourceData;
        intoData = targetData;
      }

      props.onBranchMergeRequest({
        from: fromData.name,
        into: intoData.name,
        fromRemote: fromData.isRemote,
        intoRemote: intoData.isRemote,
      });
    },
    [nodes, props.onBranchMergeRequest]
  );

  const commitIds = useMemo(() => {
    if (props.view !== "commitGraph") return [];
    const commitNodes = nodes
      .filter((n) => n.type === "commit")
      .sort((a, b) => (a.position.y ?? 0) - (b.position.y ?? 0));
    return commitNodes.map((n) => n.id);
  }, [nodes, props.view]);

  const onGraphKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (props.view !== "commitGraph" || commitIds.length === 0) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const curIdx = props.selected ? commitIds.indexOf(props.selected) : -1;
        const next = Math.min(curIdx + 1, commitIds.length - 1);
        props.onSelect(commitIds[next]);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const curIdx = props.selected ? commitIds.indexOf(props.selected) : commitIds.length;
        const prev = Math.max(curIdx - 1, 0);
        props.onSelect(commitIds[prev]);
      } else if (e.key === "Escape") {
        props.onSelect(null);
        setCtxMenu(null);
      }
    },
    [props.view, props.selected, props.onSelect, commitIds]
  );

  const nodeTypes =
    props.view === "commitGraph" ? commitGraphNodeTypes : branchTreeNodeTypes;

  const branchTreeConnect = props.view === "branchTree" && props.onBranchMergeRequest;

  return (
    <motion.div
      key={props.view}
      tabIndex={0}
      onKeyDown={onGraphKeyDown}
      className="h-full w-full min-h-[200px]"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onConnectStart={branchTreeConnect ? onConnectStart : undefined}
        onConnect={branchTreeConnect ? onConnect : undefined}
        isValidConnection={branchTreeConnect ? isValidConnection : undefined}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.12}
        maxZoom={1.85}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        nodesDraggable={props.view === "branchTree"}
        nodesConnectable={Boolean(branchTreeConnect)}
        connectionRadius={28}
        connectionLineStyle={{ stroke: "#F97316", strokeWidth: 2 }}
      >
        <FitViewOnDataChange sig={fitSig} />
        {props.view === "commitGraph" ? (
          <Panel
            position="top-right"
            className="!m-2"
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-gfs-surface2 bg-gfs-bg/90 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
              <svg className="h-3.5 w-3.5 text-gfs-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search commits…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 bg-transparent text-[11px] text-gfs-text placeholder-gfs-muted outline-none"
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="text-gfs-muted hover:text-gfs-text"
                  onClick={() => setSearchTerm("")}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
              {searchMatchIds !== null ? (
                <span className="text-[9px] text-gfs-muted">
                  {searchMatchIds === "empty" ? "0" : searchMatchIds.size}
                </span>
              ) : null}
            </div>
          </Panel>
        ) : null}
        {searchMatchIds === "empty" ? (
          <Panel position="top-center" className="!mt-12">
            <div className="rounded-lg border border-gfs-surface2 bg-gfs-bg/90 px-4 py-2.5 text-[11px] text-gfs-muted shadow-lg backdrop-blur-sm">
              No commits match &ldquo;{searchTerm.trim()}&rdquo;
            </div>
          </Panel>
        ) : null}
        {props.view === "branchTree" ? (
          <Panel
            position="top-left"
            className="!m-2 max-w-[min(92vw,320px)] rounded-lg border border-gfs-accent/25 bg-gfs-bg/90 px-3 py-2 text-[11px] text-gfs-muted shadow-lg backdrop-blur-sm"
          >
            <span className="font-semibold text-gfs-text">Drag to merge</span>
            <span className="text-gfs-muted">
              {" "}
              — drag from the branch you want to merge{" "}
              <span className="text-gfs-accent">into</span> the branch you want
              to receive the changes. Drop target must be a local branch.
            </span>
          </Panel>
        ) : null}
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
          nodeColor={getNodeColor}
        />
      </ReactFlow>
      {ctxMenu && props.api ? (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setCtxMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }}
          />
          <div
            role="menu"
            tabIndex={-1}
            ref={(el) => el?.focus()}
            onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setCtxMenu(null); } }}
            className="fixed z-[100] min-w-[160px] rounded-lg border border-gfs-surface2 bg-gfs-bg/95 py-1 shadow-xl backdrop-blur-sm outline-none"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            {[
              { label: "Checkout", action: () => props.api!.postMessage({ type: "checkout", branch: ctxMenu.hash }) },
              { label: "Cherry-pick", action: () => props.api!.postMessage({ type: "cherryPick", hash: ctxMenu.hash }) },
              { label: "View patch", action: () => props.api!.postMessage({ type: "getShow", hash: ctxMenu.hash }) },
              { label: "Branch here…", action: () => {
                const name = window.prompt("New branch at this commit:");
                if (name?.trim()) {
                  props.api!.postMessage({ type: "branchCreate", name: name.trim(), checkout: true, startPoint: ctxMenu.hash });
                }
              }},
              { label: "Reset to here…", action: () => {
                const mode = window.prompt("Reset mode: soft | mixed | hard", "mixed")?.trim().toLowerCase();
                if (mode && ["soft", "mixed", "hard"].includes(mode)) {
                  if (window.confirm(`Reset (${mode}) to ${ctxMenu.hash.slice(0, 7)}?`)) {
                    props.api!.postMessage({ type: "reset", mode, ref: ctxMenu.hash });
                  }
                }
              }},
            ].map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                className="flex w-full px-3 py-1.5 text-left text-[11px] text-gfs-text hover:bg-gfs-surface2"
                onClick={() => { item.action(); setCtxMenu(null); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

function CommitGraphFilled(props: {
  graph: GraphPayload;
  view: CanvasViewMode;
  selected: string | null;
  onSelect: (hash: string | null) => void;
  onShiftClickCommit?: (hash: string) => void;
  onBranchMergeRequest?: (p: {
    from: string;
    into: string;
    fromRemote: boolean;
    intoRemote: boolean;
  }) => void;
  api?: { postMessage: (m: unknown) => void } | null;
}) {
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

  return <GraphCanvasBody {...props} />;
}

export function CommitGraph(props: {
  graph: GraphPayload | null;
  loading?: boolean;
  view: CanvasViewMode;
  selected: string | null;
  onSelect: (hash: string | null) => void;
  onShiftClickCommit?: (hash: string) => void;
  onBranchMergeRequest?: (p: {
    from: string;
    into: string;
    fromRemote: boolean;
    intoRemote: boolean;
  }) => void;
  api?: { postMessage: (m: unknown) => void } | null;
}) {
  if (!props.graph) {
    return props.loading ? <LoadingPlaceholder /> : <NoRepoPlaceholder />;
  }

  if (props.graph.isEmptyRepo === true && props.graph.commits.length === 0) {
    return <EmptyRepoCanvas graph={props.graph} />;
  }

  return <CommitGraphFilled {...props} graph={props.graph} />;
}
