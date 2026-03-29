import { useState } from "react";
import { useUIStore } from "../../store";
import Badge from "../../../components/ui/badge";

interface MaintenancePanelProps {
  onClean: (dryRun: boolean) => void;
  onGC: () => void;
  onFsck: () => void;
}

type MaintenanceStatus = "idle" | "running" | "success" | "error";

export function MaintenancePanel({
  onClean,
  onGC,
  onFsck,
}: MaintenancePanelProps) {
  const { addToast } = useUIStore();
  const [cleanDryRun, setCleanDryRun] = useState(true);
  const [gcStatus, setGcStatus] = useState<MaintenanceStatus>("idle");
  const [fsckStatus, setFsckStatus] = useState<MaintenanceStatus>("idle");
  const [cleanStatus, setCleanStatus] = useState<MaintenanceStatus>("idle");

  const handleClean = () => {
    setCleanStatus("running");
    try {
      onClean(cleanDryRun);
      setCleanStatus("success");
      addToast("success", `Clean ${cleanDryRun ? "preview" : "completed"} successfully`);
    } catch {
      setCleanStatus("error");
      addToast("error", "Clean failed");
    }
  };

  const handleGC = () => {
    setGcStatus("running");
    try {
      onGC();
      setGcStatus("success");
      addToast("success", "Repository optimized successfully");
    } catch {
      setGcStatus("error");
      addToast("error", "GC failed");
    }
  };

  const handleFsck = () => {
    setFsckStatus("running");
    try {
      onFsck();
      setFsckStatus("success");
      addToast("success", "Integrity check passed");
    } catch {
      setFsckStatus("error");
      addToast("error", "Integrity check found issues");
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case "running":
        return <Badge variant="info" size="sm">Running...</Badge>;
      case "success":
        return <Badge variant="success" size="sm">Done</Badge>;
      case "error":
        return <Badge variant="error" size="sm">Failed</Badge>;
      default:
        return <Badge variant="default" size="sm">Ready</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-4">
        <div className="rounded-xl border border-gfs-surface2 bg-gfs-surface/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gfs-text">Optimize Repository</div>
              <div className="mt-1 text-xs text-gfs-muted">
                Run git gc to pack loose objects and optimize storage
              </div>
            </div>
            {getStatusBadge(gcStatus)}
          </div>
          <button
            type="button"
            disabled={gcStatus === "running"}
            onClick={handleGC}
            className="mt-3 rounded-lg bg-ignite/20 px-4 py-2 text-xs font-medium text-ignite ring-1 ring-ignite/30 hover:bg-ignite/30 disabled:opacity-50"
          >
            {gcStatus === "running" ? "Optimizing..." : "Run GC"}
          </button>
        </div>

        <div className="rounded-xl border border-gfs-surface2 bg-gfs-surface/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gfs-text">Check Integrity</div>
              <div className="mt-1 text-xs text-gfs-muted">
                Verify object SHA checksums and repository health
              </div>
            </div>
            {getStatusBadge(fsckStatus)}
          </div>
          <button
            type="button"
            disabled={fsckStatus === "running"}
            onClick={handleFsck}
            className="mt-3 rounded-lg bg-blue-500/20 px-4 py-2 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50"
          >
            {fsckStatus === "running" ? "Checking..." : "Run fsck"}
          </button>
        </div>

        <div className="rounded-xl border border-gfs-surface2 bg-gfs-surface/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gfs-text">Clean Untracked Files</div>
              <div className="mt-1 text-xs text-gfs-muted">
                Remove untracked files from working directory
              </div>
            </div>
            {getStatusBadge(cleanStatus)}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gfs-muted">
              <input
                type="checkbox"
                checked={cleanDryRun}
                onChange={(e) => setCleanDryRun(e.target.checked)}
                className="rounded border-gfs-surface2 bg-gfs-surface2"
              />
              Preview only (dry run)
            </label>
            <button
              type="button"
              disabled={cleanStatus === "running"}
              onClick={handleClean}
              className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
            >
              {cleanStatus === "running" ? "Cleaning..." : cleanDryRun ? "Preview" : "Clean"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
