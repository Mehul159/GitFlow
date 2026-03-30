import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { BranchTreeCardData } from "../lib/canvasGraph";

function formatRelative(ms: number): string {
  if (!ms) {
    return "—";
  }
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) {
    return "just now";
  }
  const m = Math.floor(s / 60);
  if (m < 60) {
    return `${m}m ago`;
  }
  const h = Math.floor(m / 60);
  if (h < 48) {
    return `${h}h ago`;
  }
  const d = Math.floor(h / 24);
  if (d < 30) {
    return `${d}d ago`;
  }
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function healthDot(health: BranchTreeCardData["health"]): string {
  switch (health) {
    case "good":
      return "bg-emerald-500";
    case "warn":
      return "bg-amber-500";
    default:
      return "bg-red-500/80";
  }
}

function BranchTreeCardNodeInner({ data, selected }: NodeProps<BranchTreeCardData>) {
  const rel = useMemo(() => formatRelative(data.lastActivityMs), [data.lastActivityMs]);

  const dim = data.stale ? "opacity-55" : "";

  return (
    <div
      className={[
        "w-[260px] rounded-gfs border-2 bg-gfs-surface/95 shadow-node backdrop-blur-sm transition-all duration-200",
        dim,
        selected
          ? "border-gfs-accent ring-2 ring-gfs-accent ring-offset-2 ring-offset-gfs-bg"
          : data.isCurrent
            ? "border-emerald-500/70"
            : data.isRemote
              ? "border-gfs-surface2 border-dashed"
              : "border-gfs-accent/45",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-2 !border-gfs-bg !bg-gfs-accent"
        isConnectable
      />
      <div className="flex items-start gap-2.5 p-3">
        <div
          className={[
            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
            healthDot(data.health),
          ].join(" ")}
          title={`Health: ${data.health}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div
              className={[
                "truncate font-mono text-[13px] font-semibold",
                data.isRemote ? "text-gfs-muted" : "text-gfs-text",
              ].join(" ")}
              title={data.name}
            >
              {data.name}
            </div>
            {data.stale ? (
              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/35">
                stale
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gfs-muted">
            <span>
              {data.commitCount} commit{data.commitCount !== 1 ? "s" : ""}
            </span>
            <span>·</span>
            <span title={data.lastActivityMs ? new Date(data.lastActivityMs).toLocaleString() : ""}>
              {rel}
            </span>
          </div>
          {data.hash ? (
            <div className="mt-0.5 font-mono text-[10px] text-gfs-muted/80">
              {data.hash.slice(0, 7)}
            </div>
          ) : null}
        </div>
        {data.isCurrent ? (
          <div className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-400">
            HEAD
          </div>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-2 !border-gfs-bg !bg-gfs-accent"
        isConnectable
      />
    </div>
  );
}

export const BranchTreeCardNode = memo(BranchTreeCardNodeInner);
