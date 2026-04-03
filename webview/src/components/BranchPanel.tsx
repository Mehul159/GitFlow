import { useMemo, useState } from "react";
import type { GraphPayload } from "../types";
import { detectBranchFolder, FOLDER_LABEL, FOLDER_ORDER } from "../lib/branchFolderDetect";
import Badge from "@/components/ui/badge";

export function BranchPanel(props: {
  graph: GraphPayload | null;
  currentBranch: string | null;
  onCheckout: (branch: string) => void;
  onCheckoutRemote: (remoteBranch: string) => void;
  api: { postMessage: (m: unknown) => void } | null;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [remoteOpen, setRemoteOpen] = useState(true);

  const locals = useMemo(() => {
    if (!props.graph) {
      return [];
    }
    const s = new Set<string>();
    for (const r of props.graph.refs) {
      if (r.fullName.startsWith("refs/heads/")) {
        s.add(r.name);
      }
    }
    if (props.graph.branch) {
      s.add(props.graph.branch);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [props.graph]);

  const remotes = useMemo(() => {
    if (!props.graph) {
      return [];
    }
    return props.graph.refs
      .filter((r) => r.fullName.startsWith("refs/remotes/"))
      .map((r) => r.name)
      .filter((n, i, a) => a.indexOf(n) === i)
      .sort((a, b) => a.localeCompare(b));
  }, [props.graph]);

  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const name of locals) {
      const folderId = detectBranchFolder(name);
      const label = FOLDER_LABEL[folderId];
      if (!groups[label]) groups[label] = [];
      groups[label].push(name);
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => a.localeCompare(b));
    }
    return groups;
  }, [locals]);

  const folders = useMemo(
    () => {
      const folderLabels = FOLDER_ORDER.map((id) => FOLDER_LABEL[id]);
      return Object.keys(grouped).sort(
        (a, b) => folderLabels.indexOf(a) - folderLabels.indexOf(b)
      );
    },
    [grouped]
  );

  if (!props.graph) {
    return (
      <div className="border-b border-gfs-surface2 p-4 text-sm text-gfs-muted">
        No repository loaded.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gfs-surface2">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
          Branches
        </span>
        <Badge variant="default" size="sm">{locals.length}</Badge>
      </div>
      <div className="gfs-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {folders.map((folder) => {
          const branches = grouped[folder] ?? [];
          const isOpen = open[`l-${folder}`] ?? true;
          return (
            <div key={folder} className="mb-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-gfs-text hover:bg-gfs-surface2/60"
                onClick={() =>
                  setOpen((s) => ({ ...s, [`l-${folder}`]: !isOpen }))
                }
              >
                <span className="text-gfs-muted">{isOpen ? "▾" : "▸"}</span>
                <span className="flex-1 truncate">{folder}</span>
                <span className="text-[10px] text-gfs-muted">
                  {branches.length}
                </span>
              </button>
              {isOpen ? (
                <ul className="mt-1 space-y-0.5 pl-2">
                  {branches.map((b) => {
                    const active = props.currentBranch === b;
                    return (
                      <li key={b} className="flex items-center gap-1">
                        <button
                          type="button"
                          className={[
                            "min-w-0 flex-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-all duration-200",
                            active
                              ? "bg-ignite/15 text-chalk ring-1 ring-ignite/30"
                              : "text-gfs-muted hover:bg-gfs-surface2/50 hover:text-gfs-text",
                          ].join(" ")}
                          onClick={() => props.onCheckout(b)}
                        >
                          <span
                            className={[
                              "h-2 w-2 shrink-0 rounded-full",
                              active ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-gfs-surface2",
                            ].join(" ")}
                          />
                          <span className="truncate font-mono text-[12px]">
                            {b}
                          </span>
                          {active && <Badge variant="success" size="sm" className="ml-auto">current</Badge>}
                        </button>
                        {!active ? (
                          <div className="flex shrink-0 flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={!props.api}
                              className="rounded px-1.5 py-0.5 text-[9px] text-gfs-muted hover:bg-gfs-surface2 disabled:opacity-30 disabled:pointer-events-none"
                              title="Rename"
                              onClick={() => {
                                const nn = window.prompt("New branch name:", b);
                                if (!nn?.trim() || nn.trim() === b) {
                                  return;
                                }
                                props.api?.postMessage({
                                  type: "branchRename",
                                  oldName: b,
                                  newName: nn.trim(),
                                });
                              }}
                            >
                              R
                            </button>
                            <button
                              type="button"
                              disabled={!props.api}
                              className="rounded px-1.5 py-0.5 text-[10px] text-gfs-danger hover:bg-gfs-danger/15 disabled:opacity-30 disabled:pointer-events-none"
                              title="Delete branch"
                              onClick={() => {
                                if (
                                  window.confirm(`Delete branch “${b}”?`)
                                ) {
                                  props.api?.postMessage({
                                    type: "branchDelete",
                                    name: b,
                                    force: false,
                                  });
                                }
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}

        <div className="mb-2 mt-2 border-t border-gfs-surface2 pt-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-gfs-text hover:bg-gfs-surface2/60"
            onClick={() => setRemoteOpen((v) => !v)}
          >
            <span className="text-gfs-muted">{remoteOpen ? "▾" : "▸"}</span>
            <span className="flex-1">Remote branches</span>
            <Badge variant="info" size="sm">{remotes.length}</Badge>
          </button>
          {remoteOpen ? (
            <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto pl-2 gfs-scroll">
              {remotes.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left font-mono text-[11px] text-gfs-muted hover:bg-gfs-surface2/50 hover:text-gfs-text"
                    onClick={() => props.onCheckoutRemote(r)}
                    title="Create local branch tracking this remote"
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
