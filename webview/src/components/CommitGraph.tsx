import { useCallback, useEffect, useMemo, type MouseEvent } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";

import type { GraphPayload } from "../types";
import {
  buildBranchTreeFlow,
  buildCommitGraphFlow,
  type BranchTreeCardData,
  type CanvasViewMode,
} from "../lib/canvasGraph";
import { BranchFolderNode } from "./BranchFolderNode";
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
  branchFolder: BranchFolderNode,
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
}) {
  const flow = useMemo(() => {
    return props.view === "commitGraph"
      ? buildCommitGraphFlow(props.graph)
      : buildBranchTreeFlow(props.graph);
  }, [props.graph, props.view]);

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
        if (props.view === "commitGraph") {
          return { ...n, selected: n.id === props.selected };
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
  }, [props.selected, props.view, setNodes]);

  const getNodeColor = useCallback(
    (n: Node) => {
      if (n.type === "branchFolder") {
        return "#F59E0B";
      }
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
  }, [props]);

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

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !props.onBranchMergeRequest) {
        return;
      }
      const s = nodes.find((n) => n.id === c.source);
      const t = nodes.find((n) => n.id === c.target);
      if (!s || !t) {
        return;
      }
      const sd = s.data as BranchTreeCardData;
      const td = t.data as BranchTreeCardData;
      props.onBranchMergeRequest({
        from: sd.name,
        into: td.name,
        fromRemote: sd.isRemote,
        intoRemote: td.isRemote,
      });
    },
    [nodes, props.onBranchMergeRequest]
  );

  const nodeTypes =
    props.view === "commitGraph" ? commitGraphNodeTypes : branchTreeNodeTypes;

  const branchTreeConnect = props.view === "branchTree" && props.onBranchMergeRequest;

  return (
    <motion.div
      key={props.view}
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
        onPaneClick={onPaneClick}
        onConnect={branchTreeConnect ? onConnect : undefined}
        isValidConnection={branchTreeConnect ? isValidConnection : undefined}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.12}
        maxZoom={1.85}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        nodesDraggable={false}
        nodesConnectable={Boolean(branchTreeConnect)}
        connectionRadius={28}
        connectionLineStyle={{ stroke: "#F97316", strokeWidth: 2 }}
      >
        <FitViewOnDataChange sig={fitSig} />
        {props.view === "branchTree" ? (
          <Panel
            position="top-left"
            className="!m-2 max-w-[min(92vw,320px)] rounded-lg border border-gfs-accent/25 bg-gfs-bg/90 px-3 py-2 text-[11px] text-gfs-muted shadow-lg backdrop-blur-sm"
          >
            <span className="font-semibold text-gfs-text">Drag to merge</span>
            <span className="text-gfs-muted">
              {" "}
              — pull from the <span className="text-gfs-accent">right handle</span> of
              one branch to the <span className="text-gfs-accent">left handle</span> of
              another. The target must be a local branch (solid card).
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
}) {
  if (!props.graph) {
    return <NoRepoPlaceholder />;
  }

  if (props.graph.isEmptyRepo === true && props.graph.commits.length === 0) {
    return <EmptyRepoCanvas graph={props.graph} />;
  }

  return <CommitGraphFilled {...props} graph={props.graph} />;
}
