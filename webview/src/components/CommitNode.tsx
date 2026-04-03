import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export type CommitNodeData = {
  short: string;
  subject: string;
  author: string;
  initials: string;
  tags: string[];
  branchLabels: string[];
  remoteLabels: string[];
  isHead: boolean;
  isRemoteGhost: boolean;
};

function CommitNodeInner({ data, selected }: NodeProps<CommitNodeData>) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Commit ${data.short}: ${data.subject}`}
      className={[
        "w-[200px] rounded-gfs border bg-gfs-surface/95 shadow-node backdrop-blur-sm transition-all duration-200",
        data.isRemoteGhost ? "border-dashed border-gfs-muted/60 opacity-90" : "border-gfs-surface2",
        selected ? "ring-2 ring-gfs-accent ring-offset-2 ring-offset-gfs-bg" : "",
        data.isHead ? "gfs-head-ring" : "",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-gfs-accent"
      />
      <div className="flex gap-2 p-2.5">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            data.isRemoteGhost
              ? "border border-dashed border-gfs-muted/50 bg-gfs-bg/80 text-gfs-muted"
              : "bg-gfs-primary text-gfs-text",
          ].join(" ")}
          title={data.author}
        >
          {data.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] tracking-tight text-gfs-muted">
            {data.short}
            {data.isRemoteGhost ? (
              <span className="ml-1.5 text-[9px] uppercase text-gfs-muted/80">
                remote
              </span>
            ) : null}
          </div>
          <div className="truncate text-[13px] font-medium leading-snug text-gfs-text">
            {data.subject || "(no subject)"}
          </div>
          <div className="truncate text-[11px] text-gfs-muted">{data.author}</div>
        </div>
      </div>
      {(data.branchLabels.length > 0 || data.remoteLabels.length > 0) ? (
        <div className="flex flex-wrap gap-1 border-t border-gfs-surface2 px-2.5 py-1.5">
          {data.branchLabels.slice(0, 4).map((r) => (
            <span
              key={`b-${r}`}
              className="max-w-full truncate rounded-md bg-gfs-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-gfs-accent ring-1 ring-gfs-accent/30"
            >
              {r}
            </span>
          ))}
          {data.remoteLabels.slice(0, 3).map((r) => (
            <span
              key={`m-${r}`}
              className="max-w-full truncate rounded bg-gfs-surface2 px-1.5 py-0.5 font-mono text-[9px] text-gfs-muted ring-1 ring-gfs-surface2"
              title={r}
            >
              ⎇ {r}
            </span>
          ))}
          {data.branchLabels.length + data.remoteLabels.length > 7 ? (
            <span className="text-[10px] text-gfs-muted">
              +
              {data.branchLabels.length + data.remoteLabels.length - 7}
            </span>
          ) : null}
        </div>
      ) : null}
      {data.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1 border-t border-gfs-surface2 px-2.5 py-2">
          {data.tags.map((t) => (
            <span
              key={t}
              className="max-w-full truncate rounded-full bg-gfs-bg/90 px-2.5 py-0.5 font-mono text-[10px] font-medium text-gfs-text ring-1 ring-gfs-accent/40"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-gfs-accent"
      />
    </div>
  );
}

export const CommitNode = memo(CommitNodeInner);
