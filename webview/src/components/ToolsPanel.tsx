import type { GitUserConfig, ReflogRow, SubmoduleRow, WorktreeRow } from "../types";

function formatTime(epoch: number): string {
  if (!epoch) {
    return "";
  }
  return new Date(epoch * 1000).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ToolsPanel(props: {
  api: { postMessage: (m: unknown) => void } | null;
  config: GitUserConfig | null;
  reflog: ReflogRow[];
  submodules: SubmoduleRow[];
  worktrees: WorktreeRow[];
  hasRepo: boolean;
  workspaceOpen: boolean;
}) {
  return (
    <div className="gfs-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-2 pb-4 text-xs">
      {!props.hasRepo ? (
        <div className="space-y-2 rounded-lg border border-gfs-warning/40 bg-gfs-warning/10 p-3">
          <div className="font-semibold text-gfs-text">No Git repository</div>
          <button
            type="button"
            disabled={!props.workspaceOpen}
            className="w-full rounded-lg bg-gfs-accent py-2 font-semibold text-white disabled:opacity-40"
            onClick={() => props.api?.postMessage({ type: "initRepo" })}
          >
            Initialize repository
          </button>
          <button
            type="button"
            disabled={!props.workspaceOpen}
            className="w-full rounded-lg bg-gfs-surface2 py-2 font-medium text-gfs-text disabled:opacity-40"
            onClick={() => {
              const url = window.prompt("Clone URL:");
              if (!url?.trim()) {
                return;
              }
              props.api?.postMessage({ type: "cloneRepo", url: url.trim() });
            }}
          >
            Clone into workspace folder
          </button>
        </div>
      ) : null}

      {props.hasRepo && props.config ? (
        <div className="rounded-lg border border-gfs-surface2 bg-gfs-bg/40 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Profile (local)
          </div>
          <label className="block text-[10px] text-gfs-muted">user.name</label>
          <input
            className="mb-2 w-full rounded border border-gfs-surface2 bg-gfs-surface px-2 py-1 font-mono text-[11px] text-gfs-text"
            defaultValue={props.config.userName}
            id="gfs-cfg-name"
          />
          <label className="block text-[10px] text-gfs-muted">user.email</label>
          <input
            className="mb-2 w-full rounded border border-gfs-surface2 bg-gfs-surface px-2 py-1 font-mono text-[11px] text-gfs-text"
            defaultValue={props.config.userEmail}
            id="gfs-cfg-email"
          />
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-primary py-1.5 text-[11px] font-semibold text-gfs-text ring-1 ring-gfs-accent/30"
            onClick={() => {
              const n = (
                document.getElementById("gfs-cfg-name") as HTMLInputElement
              )?.value;
              const e = (
                document.getElementById("gfs-cfg-email") as HTMLInputElement
              )?.value;
              if (n?.trim()) {
                props.api?.postMessage({
                  type: "gitConfigSet",
                  key: "user.name",
                  value: n.trim(),
                });
              }
              if (e?.trim()) {
                props.api?.postMessage({
                  type: "gitConfigSet",
                  key: "user.email",
                  value: e.trim(),
                });
              }
            }}
          >
            Save Git identity
          </button>
        </div>
      ) : null}

      {props.hasRepo ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Maintenance
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2 hover:bg-gfs-surface2/80"
            onClick={() => props.api?.postMessage({ type: "gc" })}
          >
            Optimize repository (git gc)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2 hover:bg-gfs-surface2/80"
            onClick={() => props.api?.postMessage({ type: "fsck" })}
          >
            Check integrity (git fsck)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2 hover:bg-gfs-surface2/80"
            onClick={() =>
              props.api?.postMessage({ type: "cleanPreview" })
            }
          >
            Preview clean (untracked)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-warning/20 py-1.5 text-left px-2 text-gfs-warning ring-1 ring-gfs-warning/30"
            onClick={() => {
              if (
                window.confirm(
                  "Delete untracked files and folders? This cannot be undone."
                )
              ) {
                props.api?.postMessage({ type: "clean", dirs: true });
              }
            }}
          >
            Clean untracked (git clean -fd)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2"
            onClick={() => props.api?.postMessage({ type: "submoduleUpdate" })}
          >
            Submodule update (init)
          </button>
        </div>
      ) : null}

      {props.hasRepo ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Bisect
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2"
            onClick={() => props.api?.postMessage({ type: "bisectStart" })}
          >
            Start
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-success/20 py-1.5 text-left px-2 text-gfs-success"
            onClick={() => props.api?.postMessage({ type: "bisectGood" })}
          >
            Mark good (HEAD)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-danger/20 py-1.5 text-left px-2 text-gfs-danger"
            onClick={() => props.api?.postMessage({ type: "bisectBad" })}
          >
            Mark bad (HEAD)
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2"
            onClick={() => props.api?.postMessage({ type: "bisectReset" })}
          >
            Reset bisect
          </button>
        </div>
      ) : null}

      {props.hasRepo ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Reports
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-gfs-surface2 py-1.5 text-left px-2"
            onClick={() => props.api?.postMessage({ type: "getShortlog" })}
          >
            Team shortlog
          </button>
        </div>
      ) : null}

      {props.submodules.length > 0 ? (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-gfs-muted">
            Submodules
          </div>
          <ul className="space-y-1 font-mono text-[10px] text-gfs-text">
            {props.submodules.map((s) => (
              <li key={s.path} className="truncate">
                {s.path}{" "}
                <span className="text-gfs-muted">({s.sha.slice(0, 7)})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.worktrees.length > 1 ? (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-gfs-muted">
            Worktrees
          </div>
          <ul className="space-y-1 text-[10px] text-gfs-muted">
            {props.worktrees.map((w) => (
              <li key={w.path} className="truncate">
                {w.branch || w.head.slice(0, 7)} · {w.path}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.hasRepo && props.reflog.length > 0 ? (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-gfs-muted">
            Reflog (recent)
          </div>
          <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-gfs-text">
            {props.reflog.slice(0, 20).map((l, i) => (
              <li key={`${l.ref}-${i}`} className="truncate text-gfs-muted">
                <span className="text-gfs-accent">{l.hash.slice(0, 7)}</span>{" "}
                {l.subject}{" "}
                <span className="text-gfs-muted/70">{formatTime(l.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        className="rounded-lg border border-gfs-surface2 py-2 text-[11px] text-gfs-muted hover:text-gfs-text"
        onClick={() => props.api?.postMessage({ type: "openGitSettings" })}
      >
        Open VS Code Git settings
      </button>
    </div>
  );
}
