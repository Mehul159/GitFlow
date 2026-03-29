import type { FileStatusRow } from "../types";
import Badge from "@/components/ui/badge";

function badge(staged: string, unstaged: string): string {
  if (staged && unstaged) {
    return `${staged}${unstaged}`;
  }
  return staged || unstaged || "·";
}

function getBadgeVariant(staged: string, unstaged: string): "success" | "warning" | "error" | "info" | "default" {
  if (staged && unstaged) return "warning";
  if (staged) return "success";
  if (unstaged) return "info";
  return "default";
}

export function StatusPanel(props: {
  hasRepo: boolean;
  files: FileStatusRow[];
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
  onStageAll: () => void;
  api: { postMessage: (m: unknown) => void } | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
          Working tree
        </span>
        <button
          type="button"
          disabled={!props.hasRepo}
          className="rounded-lg bg-gfs-accent/15 px-2 py-1 text-[11px] font-medium text-gfs-accent hover:bg-gfs-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={props.onStageAll}
        >
          Stage all
        </button>
      </div>
      <div className="gfs-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!props.hasRepo ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-gfs-muted">
            No Git repo detected for this workspace. Open a folder that contains
            a <code className="text-gfs-accent">.git</code> directory, add this
            folder to the workspace, or run{" "}
            <strong className="text-gfs-text">Initialize repository</strong> under
            More.
          </p>
        ) : props.files.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-gfs-muted">
            Working tree clean
          </p>
        ) : (
          <ul className="space-y-1">
            {props.files.map((f) => {
              const sel = props.selectedPaths.has(f.path);
              return (
                <li key={f.path} className="group flex items-stretch gap-0.5">
                  <button
                    type="button"
                    disabled={!props.hasRepo}
                    className={[
                      "min-w-0 flex-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all duration-200",
                      sel
                        ? "bg-ignite/20 ring-1 ring-ignite/35"
                        : "hover:bg-gfs-surface2/50",
                      !props.hasRepo ? "opacity-60" : "",
                    ].join(" ")}
                    onClick={() => props.onToggle(f.path)}
                  >
                    <Badge variant={getBadgeVariant(f.staged, f.unstaged)} size="sm" className="w-7 justify-center">
                      {badge(f.staged, f.unstaged)}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-gfs-text">
                      {f.display}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col justify-center gap-0.5 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Diff working tree"
                      disabled={!props.hasRepo}
                      className="rounded px-1 text-[9px] text-gfs-accent hover:bg-gfs-surface2 disabled:opacity-40"
                      onClick={() =>
                        props.api?.postMessage({
                          type: "getDiff",
                          path: f.path,
                          staged: false,
                        })
                      }
                    >
                      Δ
                    </button>
                    <button
                      type="button"
                      title="Diff staged"
                      disabled={!props.hasRepo}
                      className="rounded px-1 text-[9px] text-gfs-muted hover:bg-gfs-surface2 disabled:opacity-40"
                      onClick={() =>
                        props.api?.postMessage({
                          type: "getDiff",
                          path: f.path,
                          staged: true,
                        })
                      }
                    >
                      S
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
