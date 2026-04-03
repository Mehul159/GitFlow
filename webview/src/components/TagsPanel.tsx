import type { TagRow } from "../types";

export function TagsPanel(props: {
  hasRepo: boolean;
  tags: TagRow[];
  api: { postMessage: (m: unknown) => void } | null;
  headHash: string | null;
  error?: string | null;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 pb-3">
      <button
        type="button"
        disabled={!props.hasRepo}
        className="rounded-lg bg-gfs-accent/20 py-2 text-xs font-semibold text-gfs-accent ring-1 ring-gfs-accent/35 disabled:opacity-40"
        onClick={() => {
          const name = window.prompt("Tag name:");
          if (!name?.trim()) {
            return;
          }
          const ann = window.confirm("Annotated tag with message?");
          const message = ann ? window.prompt("Tag message:") : "";
          props.api?.postMessage({
            type: "tagCreate",
            name: name.trim(),
            annotated: ann && Boolean(message?.trim()),
            message: message?.trim() || undefined,
            hash: props.headHash ?? undefined,
          });
        }}
      >
        Create tag on HEAD
      </button>
      <button
        type="button"
        disabled={!props.hasRepo}
        className="rounded-lg bg-gfs-surface2 py-2 text-xs font-medium text-gfs-text disabled:opacity-40"
        onClick={() => props.api?.postMessage({ type: "push", tags: true })}
      >
        Push tags
      </button>
      <div className="gfs-scroll min-h-0 flex-1 space-y-1 overflow-y-auto">
        {props.error ? (
          <p className="py-6 text-center text-xs text-gfs-danger">Failed to load tags</p>
        ) : props.tags.length === 0 ? (
          <p className="py-6 text-center text-xs text-gfs-muted">No tags</p>
        ) : (
          props.tags.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-gfs-surface2 bg-gfs-bg/40 px-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-[11px] text-gfs-accent">
                  {t.name}
                </div>
                <div className="truncate text-[10px] text-gfs-muted">
                  {t.subject}
                </div>
              </div>
              <button
                type="button"
                disabled={!props.hasRepo}
                className="shrink-0 rounded px-2 py-0.5 text-[10px] text-gfs-danger hover:bg-gfs-danger/15 disabled:opacity-40"
                onClick={() => {
                  if (window.confirm(`Delete local tag ${t.name}?`)) {
                    props.api?.postMessage({ type: "tagDelete", name: t.name });
                  }
                }}
              >
                Del
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
