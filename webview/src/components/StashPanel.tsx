import type { StashRow } from "../types";

export function StashPanel(props: {
  hasRepo: boolean;
  rows: StashRow[];
  api: { postMessage: (m: unknown) => void } | null;
  error?: string | null;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 px-3 py-2">
        <button
          type="button"
          disabled={!props.hasRepo}
          className="w-full rounded-lg bg-gfs-accent py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-40"
          onClick={() => props.api?.postMessage({ type: "stashPush" })}
        >
          Quick stash
        </button>
        <button
          type="button"
          disabled={!props.hasRepo}
          className="w-full rounded-lg bg-gfs-surface2 py-2 text-xs font-medium text-gfs-text hover:bg-gfs-surface2/80 disabled:opacity-40"
          onClick={() => {
            const m = window.prompt("Stash message:");
            if (m === null) {
              return;
            }
            props.api?.postMessage({
              type: "stashPush",
              message: m.trim() || undefined,
            });
          }}
        >
          Stash with message
        </button>
      </div>
      <div className="gfs-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-3">
        {props.error ? (
          <p className="px-2 py-6 text-center text-xs text-gfs-danger">Failed to load stashes</p>
        ) : props.rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gfs-muted">No stashes</p>
        ) : (
          props.rows.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-gfs-surface2 bg-gfs-bg/40 p-2 text-xs"
            >
              <div className="font-mono text-[10px] text-gfs-accent">{s.id}</div>
              <div className="mt-1 text-gfs-text">{s.subject}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  disabled={!props.hasRepo}
                  className="rounded bg-gfs-primary px-2 py-0.5 text-[10px] text-gfs-text ring-1 ring-gfs-accent/30 disabled:opacity-40"
                  onClick={() =>
                    props.api?.postMessage({ type: "stashApply", index: s.index })
                  }
                >
                  Apply
                </button>
                <button
                  type="button"
                  disabled={!props.hasRepo}
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px] text-gfs-text disabled:opacity-40"
                  onClick={() =>
                    props.api?.postMessage({ type: "stashPop", index: s.index })
                  }
                >
                  Pop
                </button>
                <button
                  type="button"
                  disabled={!props.hasRepo}
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px] text-gfs-warning disabled:opacity-40"
                  onClick={() =>
                    props.api?.postMessage({ type: "stashDrop", index: s.index })
                  }
                >
                  Drop
                </button>
                <button
                  type="button"
                  disabled={!props.hasRepo}
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px] text-gfs-muted disabled:opacity-40"
                  onClick={() => {
                    const b = window.prompt("New branch name:");
                    if (!b?.trim()) {
                      return;
                    }
                    props.api?.postMessage({
                      type: "stashBranch",
                      index: s.index,
                      branch: b.trim(),
                    });
                  }}
                >
                  Branch
                </button>
              </div>
            </div>
          ))
        )}
        {props.rows.length > 0 ? (
          <button
            type="button"
            disabled={!props.hasRepo}
            className="w-full rounded-lg border border-gfs-danger/40 py-2 text-[11px] font-semibold text-gfs-danger hover:bg-gfs-danger/10 disabled:opacity-40"
            onClick={() => {
              if (window.confirm("Drop all stashes? This cannot be undone.")) {
                props.api?.postMessage({ type: "stashClear" });
              }
            }}
          >
            Clear all stashes
          </button>
        ) : null}
      </div>
    </div>
  );
}
