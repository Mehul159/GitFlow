import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export type CommitNodeData = {
  short: string;
  subject: string;
  author: string;
  initials: string;
  refs: string[];
  isHead: boolean;
};

function CommitNodeInner({ data, selected }: NodeProps<CommitNodeData>) {
  return (
    <div
      className={[
        "w-[200px] rounded-gfs border border-gfs-surface2 bg-gfs-surface/95 shadow-node backdrop-blur-sm transition-all duration-200",
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gfs-primary text-xs font-semibold text-gfs-text"
          title={data.author}
        >
          {data.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] tracking-tight text-gfs-muted">
            {data.short}
          </div>
          <div className="truncate text-[13px] font-medium leading-snug text-gfs-text">
            {data.subject || "(no subject)"}
          </div>
          <div className="truncate text-[11px] text-gfs-muted">{data.author}</div>
        </div>
      </div>
      {data.refs.length > 0 ? (
        <div className="flex flex-wrap gap-1 border-t border-gfs-surface2 px-2.5 py-2">
          {data.refs.slice(0, 4).map((r) => (
            <span
              key={r}
              className="max-w-full truncate rounded-md bg-gfs-bg/80 px-1.5 py-0.5 font-mono text-[10px] text-gfs-accent"
            >
              {r}
            </span>
          ))}
          {data.refs.length > 4 ? (
            <span className="text-[10px] text-gfs-muted">
              +{data.refs.length - 4}
            </span>
          ) : null}
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
