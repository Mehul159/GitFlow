import type { AheadBehind, MergeState } from "../types";
import type { CanvasViewMode } from "../lib/canvasGraph";
import { ConfirmModal, BranchModal, MergeModal, RebaseModal, PushUpstreamModal } from "./modals";
import { useState } from "react";

interface BranchModalState {
  isOpen: boolean;
}

interface PushNoUpstream {
  branch: string;
  remote: string;
}

export function Toolbar(props: {
  api: { postMessage: (m: unknown) => void } | null;
  hasRepo: boolean;
  mergeState: MergeState | null;
  aheadBehind: AheadBehind | null;
  pushNoUpstream: PushNoUpstream | null;
  setPushNoUpstream: (value: PushNoUpstream | null) => void;
  canvasView: CanvasViewMode;
  onCanvasViewChange: (v: CanvasViewMode) => void;
}) {
  const [branchModal, setBranchModal] = useState<BranchModalState>({ isOpen: false });
  const [pullConfirm, setPullConfirm] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [rebaseModal, setRebaseModal] = useState(false);
  const [forcePushModal, setForcePushModal] = useState(false);

  const ms = props.mergeState;
  const conflict =
    ms &&
    (ms.merging ||
      ms.rebasing ||
      ms.cherryPick ||
      ms.revert ||
      ms.conflictFiles.length > 0);

  const handleBranchCreate = (name: string, checkout: boolean, startPoint?: string) => {
    props.api?.postMessage({
      type: "branchCreate",
      name,
      checkout,
      startPoint,
    });
    setBranchModal({ isOpen: false });
  };

  const handlePull = (rebase: boolean) => {
    props.api?.postMessage({ type: "pull", rebase });
    setPullConfirm(false);
  };

  const handleMerge = (branch: string, squash: boolean, noFf: boolean) => {
    props.api?.postMessage({
      type: "merge",
      branch,
      squash,
      noFf,
    });
    setMergeModalOpen(false);
  };

  const handleRebase = (onto: string) => {
    props.api?.postMessage({ type: "rebase", onto });
    setRebaseModal(false);
  };

  const handleForcePush = () => {
    props.api?.postMessage({ type: "push", force: true });
    setForcePushModal(false);
  };

  return (
    <>
      <div className="flex shrink-0 flex-col border-b border-gfs-surface2 bg-gfs-bg/95">
        {conflict ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-gfs-danger/40 bg-gfs-danger/15 px-3 py-2 text-[11px] text-gfs-text">
            <span className="font-semibold text-gfs-danger">Attention</span>
            {ms?.merging ? <span>Merge in progress</span> : null}
            {ms?.rebasing ? <span>Rebase in progress</span> : null}
            {ms?.cherryPick ? <span>Cherry-pick in progress</span> : null}
            {ms?.revert ? <span>Revert in progress</span> : null}
            {ms && ms.conflictFiles.length > 0 ? (
              <span className="text-gfs-muted">
                {ms.conflictFiles.length} conflicted file(s)
              </span>
            ) : null}
            <div className="ml-auto flex max-w-[55%] flex-wrap justify-end gap-1">
              {ms?.conflictFiles.slice(0, 6).map((f) => (
                <button
                  key={f}
                  type="button"
                  className="max-w-[140px] truncate rounded bg-gfs-bg/60 px-2 py-0.5 text-[10px] text-gfs-accent ring-1 ring-gfs-accent/30 hover:bg-gfs-bg"
                  title={f}
                  onClick={() =>
                    props.api?.postMessage({ type: "openInEditor", path: f })
                  }
                >
                  {f.split("/").pop()}
                </button>
              ))}
              {ms?.merging ? (
                <button
                  type="button"
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px]"
                  onClick={() => props.api?.postMessage({ type: "mergeAbort" })}
                >
                  Abort merge
                </button>
              ) : null}
              {ms?.rebasing ? (
                <button
                  type="button"
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px]"
                  onClick={() => props.api?.postMessage({ type: "rebaseAbort" })}
                >
                  Abort rebase
                </button>
              ) : null}
              {ms?.cherryPick ? (
                <button
                  type="button"
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px]"
                  onClick={() =>
                    props.api?.postMessage({ type: "cherryPickAbort" })
                  }
                >
                  Abort cherry-pick
                </button>
              ) : null}
              {ms?.revert ? (
                <button
                  type="button"
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px]"
                  onClick={() =>
                    props.api?.postMessage({ type: "revertAbort" })
                  }
                >
                  Abort revert
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gfs-surface/30">
          <div
            className="mr-1 flex shrink-0 rounded-lg bg-gfs-bg/80 p-0.5 ring-1 ring-gfs-surface2"
            role="group"
            aria-label="Canvas view"
          >
            <button
              type="button"
              title="Commit graph: commits and parent links"
              className={[
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                props.canvasView === "commitGraph"
                  ? "bg-gfs-accent text-white shadow-sm"
                  : "text-gfs-muted hover:text-gfs-text",
              ].join(" ")}
              onClick={() => props.onCanvasViewChange("commitGraph")}
            >
              Commit graph
            </button>
            <button
              type="button"
              title="Branch tree: folders, health, stale branches"
              className={[
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                props.canvasView === "branchTree"
                  ? "bg-gfs-accent text-white shadow-sm"
                  : "text-gfs-muted hover:text-gfs-text",
              ].join(" ")}
              onClick={() => props.onCanvasViewChange("branchTree")}
            >
              Branch tree
            </button>
          </div>

          <span className="mx-0.5 h-5 w-px bg-gfs-surface2" />

          {!props.api ? (
            <span className="text-[11px] text-gfs-muted">Git actions require the extension host.</span>
          ) : null}

          {props.api ? (
            <>
          <button
            type="button"
            disabled={!props.hasRepo}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            title="Create new branch"
            onClick={() => setBranchModal({ isOpen: true })}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gfs-surface2 px-3 py-1.5 text-[12px] font-medium text-gfs-text hover:bg-gfs-surface2/80 transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => props.api?.postMessage({ type: "fetch" })}
          >
            Fetch
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gfs-surface2 px-3 py-1.5 text-[12px] font-medium text-gfs-text hover:bg-gfs-surface2/80 transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => setPullConfirm(true)}
          >
            Pull
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gradient-to-r from-ignite/80 to-ignite px-3 py-1.5 text-[12px] font-semibold text-chalk shadow-lg shadow-ignite/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => props.api?.postMessage({ type: "push" })}
          >
            Push
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-red-500/20 px-3 py-1.5 text-[12px] font-semibold text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/30 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => setForcePushModal(true)}
          >
            Force Push
          </button>
          
          <span className="mx-1 h-5 w-px bg-gfs-surface2" />
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gfs-surface2 px-3 py-1.5 text-[12px] text-gfs-text hover:bg-gfs-surface2/80 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => setMergeModalOpen(true)}
          >
            Merge
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gfs-surface2 px-3 py-1.5 text-[12px] text-gfs-text hover:bg-gfs-surface2/80 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => setRebaseModal(true)}
          >
            Rebase
          </button>
          
          <button
            type="button"
            disabled={!props.hasRepo}
            className="rounded-lg bg-gfs-surface2 px-3 py-1.5 text-[12px] text-gfs-text hover:bg-gfs-surface2/80 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => setBranchModal({ isOpen: true })}
          >
            Branch
          </button>
          
          {props.aheadBehind ? (
            <span className="ml-auto font-mono text-[10px] text-gfs-muted">
              ↑{props.aheadBehind.ahead} ↓{props.aheadBehind.behind}
              {props.aheadBehind.upstream ? ` · ${props.aheadBehind.upstream}` : ""}
            </span>
          ) : (
            <span className="ml-auto text-[10px] text-gfs-muted">no upstream</span>
          )}
            </>
          ) : null}
        </div>
      </div>

      {/* Branch Create Modal */}
      <BranchModal
        isOpen={branchModal.isOpen}
        onConfirm={handleBranchCreate}
        onClose={() => setBranchModal({ isOpen: false })}
      />

      {/* Pull Confirm Modal */}
      <ConfirmModal
        isOpen={pullConfirm}
        title="Pull Options"
        message="Do you want to pull with rebase, or a normal merge pull?"
        confirmLabel="Pull with Rebase"
        cancelLabel="Pull (merge)"
        variant="warning"
        onConfirm={() => handlePull(true)}
        onCancel={() => handlePull(false)}
        onClose={() => setPullConfirm(false)}
      />

      {/* Merge Modal */}
      <MergeModal
        isOpen={mergeModalOpen}
        onConfirm={handleMerge}
        onClose={() => setMergeModalOpen(false)}
      />

      {/* Rebase Modal */}
      <RebaseModal
        isOpen={rebaseModal}
        onConfirm={handleRebase}
        onClose={() => setRebaseModal(false)}
      />

      {/* Force Push Confirm */}
      <ConfirmModal
        isOpen={forcePushModal}
        title="Force Push"
        message="Force push is dangerous and can overwrite remote history. Are you sure?"
        confirmLabel="Force Push"
        variant="danger"
        onConfirm={handleForcePush}
        onClose={() => setForcePushModal(false)}
      />

      {/* Push Upstream Modal */}
      <PushUpstreamModal
        isOpen={props.pushNoUpstream !== null}
        branch={props.pushNoUpstream?.branch || ""}
        remote={props.pushNoUpstream?.remote || "origin"}
        onConfirm={() => {
          if (props.pushNoUpstream) {
            props.api?.postMessage({
              type: "pushSetUpstream",
              remote: props.pushNoUpstream.remote,
              branch: props.pushNoUpstream.branch,
            });
          }
          props.setPushNoUpstream(null);
        }}
        onCancel={() => props.setPushNoUpstream(null)}
      />
    </>
  );
}
