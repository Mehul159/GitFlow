import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export type BranchNodeData = {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  hash: string;
  commitCount: number;
};

function BranchNodeInner({ data, selected }: NodeProps<BranchNodeData>) {
  return (
    <div
      className={[
        "w-[220px] rounded-gfs border-2 bg-gfs-surface/95 shadow-node backdrop-blur-sm transition-all duration-200",
        selected
          ? "border-gfs-accent ring-2 ring-gfs-accent ring-offset-2 ring-offset-gfs-bg"
          : data.isCurrent
            ? "border-green-500/70"
            : data.isRemote
              ? "border-gfs-surface2"
              : "border-gfs-accent/50",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-0 bg-gfs-accent"
      />
      <div className="flex items-center gap-3 p-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg",
            data.isRemote
              ? "bg-gfs-surface2 text-gfs-muted"
              : "bg-gfs-primary text-gfs-text",
          ].join(" ")}
        >
          {data.isRemote ? "⎇" : "⑂"}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={[
              "truncate font-mono text-sm font-semibold",
              data.isRemote ? "text-gfs-muted" : "text-gfs-text",
            ].join(" ")}
            title={data.name}
          >
            {data.name}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gfs-muted">
            <span className="font-mono">{data.hash.slice(0, 7)}</span>
            <span>·</span>
            <span>
              {data.commitCount} commit{data.commitCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {data.isCurrent && (
          <div className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-400">
            HEAD
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-0 bg-gfs-accent"
      />
    </div>
  );
}

export const BranchNode = memo(BranchNodeInner);
