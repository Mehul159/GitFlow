import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "reactflow";

import type {
  GraphPayload,
  RepoExtrasPayload,
  StatusPayload,
} from "./types";
import { getVsCodeApi } from "./vscode";
import { BranchPanel } from "./components/BranchPanel";
import { StatusPanel } from "./components/StatusPanel";
import { CommitGraph } from "./components/CommitGraph";
import { CommitComposer, DetailPanel } from "./components/DetailPanel";
import { Toolbar } from "./components/Toolbar";
import { CommandPalette } from "./components/CommandPalette";
import type { CanvasViewMode } from "./lib/canvasGraph";
import { StashPanel } from "./components/StashPanel";
import { RemotesPanel } from "./components/RemotesPanel";
import { TagsPanel } from "./components/TagsPanel";
import { ToolsPanel } from "./components/ToolsPanel";
import { TextDocModal } from "./components/TextDocModal";
import { BranchMergeConnectModal } from "./components/modals/BranchMergeConnectModal";
import { MergeBranchOutcomeModal } from "./components/modals/MergeBranchOutcomeModal";
import AnimatedTabs from "@/components/ui/animated-tabs";
import Badge from "@/components/ui/badge";

type Toast = { id: number; level: "info" | "error"; message: string };

const emptyMerge = {
  merging: false,
  rebasing: false,
  cherryPick: false,
  revert: false,
  conflictFiles: [] as string[],
};

export default function App() {
  const api = useMemo(() => getVsCodeApi(), []);
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [graphErr, setGraphErr] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [extras, setExtras] = useState<RepoExtrasPayload | null>(null);
  const [extrasErr, setExtrasErr] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [fileSel, setFileSel] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ai, setAi] = useState({ gemini: false, groq: false });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [textDoc, setTextDoc] = useState<{
    title: string;
    body: string;
    language?: string;
  } | null>(null);
  const [diffAnchor, setDiffAnchor] = useState<string | null>(null);
  const [pushNoUpstream, setPushNoUpstream] = useState<{ branch: string; remote: string } | null>(null);
  const [canvasView, setCanvasView] = useState<CanvasViewMode>("commitGraph");
  const [branchMergeDraft, setBranchMergeDraft] = useState<{
    from: string;
    into: string;
    fromRemote: boolean;
    intoRemote: boolean;
  } | null>(null);
  const [mergeOutcome, setMergeOutcome] = useState<{
    status: "conflict" | "error";
    message?: string;
    conflictFiles?: string[];
  } | null>(null);

  const hasRepo = graph !== null && graphErr === null;
  const mergeState = extras?.mergeState ?? emptyMerge;
  const aheadBehind = extras?.aheadBehind ?? null;

  const pushToast = useCallback((level: Toast["level"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, level, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const d = event.data;
      if (!d || typeof d !== "object") {
        return;
      }
      switch (d.type) {
        case "graph":
          setGraphErr(typeof d.error === "string" ? d.error : null);
          setGraph(d.payload as GraphPayload | null);
          break;
        case "status":
          setStatusErr(typeof d.error === "string" ? d.error : null);
          setStatus(d.payload as StatusPayload | null);
          setFileSel(new Set());
          break;
        case "extras":
          setExtrasErr(typeof d.error === "string" ? d.error : null);
          setExtras(d.payload as RepoExtrasPayload | null);
          break;
        case "toast":
          if (typeof d.message === "string") {
            pushToast(d.level === "error" ? "error" : "info", d.message);
          }
          break;
        case "config":
          setAi({
            gemini: Boolean(d.geminiConfigured),
            groq: Boolean(d.groqConfigured),
          });
          break;
        case "hostRefresh":
          api?.postMessage({ type: "refresh" });
          break;
        case "openCommandPalette":
          setPaletteOpen(true);
          break;
        case "textDocument":
          if (typeof d.title === "string" && typeof d.body === "string") {
            setTextDoc({
              title: d.title,
              body: d.body,
              language: typeof d.language === "string" ? d.language : undefined,
            });
          }
          break;
        case "pushNoUpstream":
          if (typeof d.branch === "string" && typeof d.remote === "string") {
            setPushNoUpstream({ branch: d.branch, remote: d.remote });
          }
          break;
        case "mergeResult": {
          const st = (d as { status?: unknown }).status;
          if (st === "ok") {
            break;
          }
          if (st === "conflict" || st === "error") {
            const payload = d as {
              message?: unknown;
              conflictFiles?: unknown;
            };
            setMergeOutcome({
              status: st,
              message: typeof payload.message === "string" ? payload.message : undefined,
              conflictFiles: Array.isArray(payload.conflictFiles)
                ? (payload.conflictFiles as string[])
                : undefined,
            });
          }
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("message", onMsg);
    api?.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", onMsg);
  }, [api, pushToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleFile = useCallback((path: string) => {
    setFileSel((prev) => {
      const n = new Set(prev);
      if (n.has(path)) {
        n.delete(path);
      } else {
        n.add(path);
      }
      return n;
    });
  }, []);

  const stageSelected = useCallback(() => {
    if (!api || fileSel.size === 0) {
      return;
    }
    api.postMessage({ type: "stage", paths: Array.from(fileSel) });
  }, [api, fileSel]);

  const unstageSelected = useCallback(() => {
    if (!api || fileSel.size === 0) {
      return;
    }
    api.postMessage({ type: "unstage", paths: Array.from(fileSel) });
  }, [api, fileSel]);

  const discardSelected = useCallback(() => {
    if (!api || fileSel.size === 0) {
      return;
    }
    if (
      !window.confirm(
        "Discard working tree changes for selected files? This cannot be undone."
      )
    ) {
      return;
    }
    api.postMessage({ type: "discard", paths: Array.from(fileSel) });
  }, [api, fileSel]);

  const checkout = useCallback(
    (branch: string) => {
      api?.postMessage({ type: "checkout", branch });
    },
    [api]
  );

  const checkoutRemote = useCallback(
    (name: string) => {
      api?.postMessage({ type: "checkoutRemote", name });
    },
    [api]
  );

  const onBranchMergeRequest = useCallback(
    (p: {
      from: string;
      into: string;
      fromRemote: boolean;
      intoRemote: boolean;
    }) => {
      setBranchMergeDraft(p);
    },
    []
  );

  const onShiftCommit = useCallback(
    (hash: string) => {
      if (!api) {
        return;
      }
      if (!diffAnchor) {
        setDiffAnchor(hash);
        pushToast(
          "info",
          `Compare A: ${hash.slice(0, 7)} — shift-click another commit`
        );
        return;
      }
      if (diffAnchor === hash) {
        setDiffAnchor(null);
        pushToast("info", "Compare cancelled.");
        return;
      }
      api.postMessage({ type: "getDiff", from: diffAnchor, to: hash });
      setDiffAnchor(null);
    },
    [api, diffAnchor, pushToast]
  );

  const files = status?.files ?? [];

  const tabs = [
    {
      id: "git",
      label: "Git",
      content: (
        <>
          <div className="min-h-0 shrink-0" style={{ maxHeight: "38%" }}>
            <BranchPanel
              graph={graph}
              currentBranch={graph?.branch ?? null}
              onCheckout={checkout}
              onCheckoutRemote={checkoutRemote}
              api={api}
            />
          </div>
          <div className="min-h-0 flex-1 border-t border-gfs-surface2">
            <StatusPanel
              hasRepo={hasRepo}
              files={files}
              selectedPaths={fileSel}
              onToggle={toggleFile}
              onStageAll={() => api?.postMessage({ type: "stageAll" })}
              api={api}
            />
            <div className="grid grid-cols-2 gap-1 border-t border-gfs-surface2 px-2 py-2">
              <button
                type="button"
                disabled={!hasRepo || fileSel.size === 0}
                className="rounded-lg bg-gfs-accent/20 py-1.5 text-[10px] font-semibold text-gfs-accent ring-1 ring-gfs-accent/30 disabled:opacity-40"
                onClick={stageSelected}
              >
                Stage
              </button>
              <button
                type="button"
                disabled={!hasRepo || fileSel.size === 0}
                className="rounded-lg bg-gfs-surface2 py-1.5 text-[10px] font-semibold text-gfs-text disabled:opacity-40"
                onClick={unstageSelected}
              >
                Unstage
              </button>
              <button
                type="button"
                disabled={!hasRepo || fileSel.size === 0}
                className="col-span-2 rounded-lg bg-gfs-danger/15 py-1.5 text-[10px] font-semibold text-gfs-danger ring-1 ring-gfs-danger/25 disabled:opacity-40"
                onClick={discardSelected}
              >
                Discard selected
              </button>
            </div>
            <CommitComposer
              hasRepo={hasRepo}
              api={api}
              geminiConfigured={ai.gemini}
              groqConfigured={ai.groq}
            />
          </div>
        </>
      ),
    },
    {
      id: "stash",
      label: "Stash",
      content: (
        <div className="min-h-0 flex-1 overflow-hidden">
          <StashPanel
            hasRepo={hasRepo}
            rows={extras?.stash ?? []}
            api={api}
          />
        </div>
      ),
    },
    {
      id: "remotes",
      label: "Net",
      content: (
        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <RemotesPanel
            hasRepo={hasRepo}
            remotes={extras?.remotes ?? []}
            api={api}
          />
        </div>
      ),
    },
    {
      id: "tags",
      label: "Tags",
      content: (
        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <TagsPanel
            hasRepo={hasRepo}
            tags={extras?.tags ?? []}
            api={api}
            headHash={graph?.head ?? null}
          />
        </div>
      ),
    },
    {
      id: "tools",
      label: "More",
      content: (
        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <ToolsPanel
            api={api}
            config={extras?.config ?? null}
            reflog={extras?.reflog ?? []}
            submodules={extras?.submodules ?? []}
            worktrees={extras?.worktrees ?? []}
            hasRepo={hasRepo}
            workspaceOpen
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col bg-gfs-bg text-gfs-text">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gfs-surface2 px-4 bg-gradient-to-r from-gfs-surface/80 to-gfs-bg">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ignite/80 to-ignite shadow-lg shadow-ignite/20 ring-1 ring-ignite/40">
            <span className="text-sm font-bold text-chalk">GF</span>
          </div>
          <div>
            <div className="text-base font-semibold leading-tight bg-gradient-to-r from-chalk to-blush bg-clip-text text-transparent">
              GitFlow Studio
            </div>
            <div className="mt-0.5 text-[10px] text-gfs-muted flex items-center gap-1">
              <kbd className="rounded bg-gfs-surface2 px-1.5 py-0.5 text-[9px] font-mono">⌘K</kbd>
              <span className="text-gfs-muted/60">palette</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gfs-muted hover:bg-gfs-surface2 hover:text-gfs-text transition-all duration-200"
            onClick={() => setPaletteOpen(true)}
          >
            Commands
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gfs-muted hover:bg-gfs-surface2 hover:text-gfs-text transition-all duration-200"
            onClick={() => api?.postMessage({ type: "refresh" })}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-gfs-surface2 bg-gfs-surface/30">
          <div className="shrink-0 p-2">
            <AnimatedTabs tabs={tabs} defaultTab="git" />
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          {(graphErr || statusErr || extrasErr) && (
            <div className="absolute left-3 right-3 top-3 z-30 rounded-lg border border-gfs-danger/40 bg-gfs-danger/15 px-3 py-2 text-xs text-gfs-text">
              {Array.from(
                new Set(
                  [graphErr, statusErr, extrasErr].filter(
                    (x): x is string => Boolean(x)
                  )
                )
              ).join(" · ")}
            </div>
          )}
          <Toolbar
            api={api}
            hasRepo={hasRepo}
            mergeState={mergeState}
            aheadBehind={aheadBehind}
            pushNoUpstream={pushNoUpstream}
            setPushNoUpstream={setPushNoUpstream}
            canvasView={canvasView}
            onCanvasViewChange={setCanvasView}
          />
          <div className="min-h-0 flex-1">
            {graphErr ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 max-w-md">
                  <div className="mb-3 text-lg font-semibold text-red-400">
                    Failed to Load Git History
                  </div>
                  <div className="mb-4 text-sm text-gfs-muted">
                    {graphErr}
                  </div>
                  <button
                    type="button"
                    onClick={() => api?.postMessage({ type: "refresh" })}
                    className="rounded-lg bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-400 ring-1 ring-orange-500/30 hover:bg-orange-500/30"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <ReactFlowProvider>
                <CommitGraph
                  graph={graph}
                  view={canvasView}
                  selected={selectedCommit}
                  onSelect={setSelectedCommit}
                  onShiftClickCommit={hasRepo ? onShiftCommit : undefined}
                  onBranchMergeRequest={
                    hasRepo && api ? onBranchMergeRequest : undefined
                  }
                />
              </ReactFlowProvider>
            )}
          </div>
          <footer className="flex h-10 shrink-0 items-center justify-between border-t border-gfs-surface2 bg-gradient-to-r from-gfs-surface/50 to-gfs-bg px-4 text-[11px] text-gfs-muted">
            <div className="flex min-w-0 items-center gap-3">
              <Badge variant={graph?.branch ? "success" : "warning"} size="sm">
                {graph?.branch ?? "detached"}
              </Badge>
              <span className="truncate text-gfs-muted/80">
                {graph?.head ? graph.head.slice(0, 7) : "—"} ·{" "}
                {graph?.commits.length ?? 0} commits
                {diffAnchor ? ` · compare ${diffAnchor.slice(0, 7)}` : ""}
              </span>
            </div>
            <span className="shrink-0 text-gfs-muted/60 text-[10px]">GitFlow Studio</span>
          </footer>
          <DetailPanel
            graph={graph}
            hash={selectedCommit}
            onClose={() => setSelectedCommit(null)}
            api={api}
          />
        </main>
      </div>

      <BranchMergeConnectModal
        isOpen={branchMergeDraft !== null}
        from={branchMergeDraft?.from ?? ""}
        into={branchMergeDraft?.into ?? ""}
        fromRemote={branchMergeDraft?.fromRemote ?? false}
        intoRemote={branchMergeDraft?.intoRemote ?? false}
        workingTreeDirty={Boolean(status && !status.clean)}
        onClose={() => setBranchMergeDraft(null)}
        onConfirm={(squash, noFf) => {
          if (!branchMergeDraft || !api) {
            return;
          }
          api.postMessage({
            type: "mergeBranches",
            into: branchMergeDraft.into,
            from: branchMergeDraft.from,
            squash,
            noFf,
          });
          setBranchMergeDraft(null);
        }}
      />

      <MergeBranchOutcomeModal
        isOpen={mergeOutcome !== null}
        status={mergeOutcome?.status ?? "error"}
        message={mergeOutcome?.message}
        conflictFiles={mergeOutcome?.conflictFiles}
        api={api}
        onClose={() => setMergeOutcome(null)}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        api={api}
        hasRepo={hasRepo}
      />

      {textDoc ? (
        <TextDocModal
          title={textDoc.title}
          body={textDoc.body}
          language={textDoc.language}
          onClose={() => setTextDoc(null)}
        />
      ) : null}

      <div className="pointer-events-none fixed right-3 top-14 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur",
              t.level === "error"
                ? "border-gfs-danger/50 bg-gfs-danger/20 text-gfs-text"
                : "border-gfs-accent/30 bg-gfs-surface text-gfs-text",
            ].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
