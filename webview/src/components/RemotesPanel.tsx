import type { RemoteRow } from "../types";

export function RemotesPanel(props: {
  hasRepo: boolean;
  remotes: RemoteRow[];
  api: { postMessage: (m: unknown) => void } | null;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 pb-3">
      <button
        type="button"
        disabled={!props.hasRepo}
        className="rounded-lg bg-gfs-accent/20 py-2 text-xs font-semibold text-gfs-accent ring-1 ring-gfs-accent/35 hover:bg-gfs-accent/30 disabled:opacity-40"
        onClick={() => {
          const name = window.prompt("Remote name:");
          const url = window.prompt("Remote URL:");
          if (!name?.trim() || !url?.trim()) {
            return;
          }
          props.api?.postMessage({
            type: "remoteAdd",
            name: name.trim(),
            url: url.trim(),
          });
        }}
      >
        Add remote
      </button>
      <div className="gfs-scroll min-h-0 flex-1 space-y-2 overflow-y-auto">
        {props.remotes.length === 0 ? (
          <p className="py-6 text-center text-xs text-gfs-muted">No remotes</p>
        ) : (
          props.remotes.map((r) => (
            <div
              key={r.name}
              className="rounded-lg border border-gfs-surface2 bg-gfs-bg/40 p-2 text-xs"
            >
              <div className="font-semibold text-gfs-text">{r.name}</div>
              <div className="mt-1 break-all font-mono text-[10px] text-gfs-muted">
                {r.fetchUrl || r.pushUrl}
              </div>
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  disabled={!props.hasRepo}
                  className="rounded bg-gfs-surface2 px-2 py-0.5 text-[10px] text-gfs-danger disabled:opacity-40"
                  onClick={() => {
                    if (
                      window.confirm(`Remove remote "${r.name}"?`)
                    ) {
                      props.api?.postMessage({
                        type: "remoteRemove",
                        name: r.name,
                      });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
