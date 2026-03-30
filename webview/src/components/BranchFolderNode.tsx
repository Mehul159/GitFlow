import { memo } from "react";
import type { BranchFolderNodeData } from "../lib/canvasGraph";
import type { NodeProps } from "reactflow";

function BranchFolderNodeInner({
  data,
}: NodeProps<BranchFolderNodeData>) {
  return (
    <div className="w-[260px] rounded-t-lg border border-b-0 border-gfs-accent/35 bg-gfs-primary/90 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gfs-accent">
          {data.label}
        </span>
        <span className="rounded-full bg-gfs-bg/60 px-2 py-0.5 font-mono text-[10px] text-gfs-muted">
          {data.branchCount}
        </span>
      </div>
    </div>
  );
}

export const BranchFolderNode = memo(BranchFolderNodeInner);
