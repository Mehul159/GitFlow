import { useEffect, useMemo, useRef, useState } from "react";

type Item = {
  id: string;
  label: string;
  sub?: string;
  keywords: string;
  category: string;
  run: () => void;
};

export function CommandPalette(props: {
  open: boolean;
  onClose: () => void;
  api: { postMessage: (m: unknown) => void } | null;
  hasRepo: boolean;
}) {
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (props.open) {
      setQ("");
      setActiveCategory(null);
      setActiveIdx(0);
    }
  }, [props.open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q, activeCategory]);

  const categories = [
    { id: "sync", label: "Sync", icon: "↻" },
    { id: "branch", label: "Branch", icon: "⑂" },
    { id: "commit", label: "Commit", icon: "✓" },
    { id: "stash", label: "Stash", icon: "◫" },
    { id: "maintenance", label: "Maintenance", icon: "⚙" },
    { id: "settings", label: "Settings", icon: "⚐" },
  ];

  const items = useMemo(() => {
    const a = props.api;
    const ok = props.hasRepo;
    const list: Item[] = [
      // General
      {
        id: "refresh",
        label: "Refresh graph & status",
        keywords: "reload sync update",
        category: "sync",
        run: () => a?.postMessage({ type: "refresh" }),
      },
      // Settings
      {
        id: "settings",
        label: "GitFlow Studio settings",
        keywords: "api key gemini groq config",
        category: "settings",
        run: () => a?.postMessage({ type: "openSettings" }),
      },
      {
        id: "git-settings",
        label: "VS Code Git settings",
        keywords: "vscode git config",
        category: "settings",
        run: () => a?.postMessage({ type: "openGitSettings" }),
      },
    ];

    if (ok) {
      list.push(
        // Sync
        {
          id: "fetch",
          label: "Fetch all remotes",
          keywords: "download remote update",
          category: "sync",
          run: () => a?.postMessage({ type: "fetch" }),
        },
        {
          id: "pull",
          label: "Pull",
          keywords: "merge remote download",
          category: "sync",
          run: () => a?.postMessage({ type: "pull", rebase: false }),
        },
        {
          id: "pull-rebase",
          label: "Pull with rebase",
          keywords: "rebase remote download",
          category: "sync",
          run: () => a?.postMessage({ type: "pull", rebase: true }),
        },
        {
          id: "push",
          label: "Push",
          keywords: "upload remote",
          category: "sync",
          run: () => a?.postMessage({ type: "push" }),
        },
        {
          id: "push-force",
          label: "Force push",
          keywords: "force upload remote danger",
          category: "sync",
          run: () => {
            if (window.confirm("Force push can overwrite remote history. Continue?")) {
              a?.postMessage({ type: "push", force: true });
            }
          },
        },
        // Branch
        {
          id: "branch-create",
          label: "Create new branch",
          keywords: "new branch checkout",
          category: "branch",
          run: () => a?.postMessage({ type: "branchCreate", name: "", checkout: true }),
        },
        {
          id: "branch-delete",
          label: "Delete branch",
          keywords: "remove delete branch",
          category: "branch",
          run: () => a?.postMessage({ type: "branchDelete" }),
        },
        // Commit
        {
          id: "stage-all",
          label: "Stage all changes",
          keywords: "git add all",
          category: "commit",
          run: () => a?.postMessage({ type: "stageAll" }),
        },
        {
          id: "commit",
          label: "Commit staged changes",
          keywords: "commit save message",
          category: "commit",
          run: () => a?.postMessage({ type: "commit" }),
        },
        // Stash
        {
          id: "stash-push",
          label: "Stash changes",
          keywords: "save wip push",
          category: "stash",
          run: () => a?.postMessage({ type: "stashPush" }),
        },
        {
          id: "stash-pop",
          label: "Stash pop (apply & drop)",
          keywords: "restore wip",
          category: "stash",
          run: () => a?.postMessage({ type: "stashPop" }),
        },
        {
          id: "stash-clear",
          label: "Clear all stashes",
          keywords: "delete remove stash",
          category: "stash",
          run: () => {
            if (window.confirm("Clear ALL stashes? This cannot be undone.")) {
              a?.postMessage({ type: "stashClear" });
            }
          },
        },
        // Maintenance
        {
          id: "clean-preview",
          label: "Preview git clean",
          keywords: "untracked remove",
          category: "maintenance",
          run: () => a?.postMessage({ type: "cleanPreview" }),
        },
        {
          id: "gc",
          label: "Garbage collect (git gc)",
          keywords: "optimize maintenance",
          category: "maintenance",
          run: () => a?.postMessage({ type: "gc" }),
        },
        {
          id: "fsck",
          label: "Verify repository (git fsck)",
          keywords: "integrity check verify",
          category: "maintenance",
          run: () => a?.postMessage({ type: "fsck" }),
        },
        {
          id: "shortlog",
          label: "Team shortlog",
          keywords: "authors stats",
          category: "maintenance",
          run: () => a?.postMessage({ type: "getShortlog" }),
        },
        // Bisect
        {
          id: "bisect-start",
          label: "Start bisect",
          keywords: "binary search bug",
          category: "maintenance",
          run: () => a?.postMessage({ type: "bisectStart" }),
        },
        {
          id: "bisect-good",
          label: "Mark commit as good",
          keywords: "bisect working",
          category: "maintenance",
          run: () => a?.postMessage({ type: "bisectGood" }),
        },
        {
          id: "bisect-bad",
          label: "Mark commit as bad",
          keywords: "bisect broken",
          category: "maintenance",
          run: () => a?.postMessage({ type: "bisectBad" }),
        },
        {
          id: "bisect-reset",
          label: "Stop bisecting",
          keywords: "bisect cancel stop",
          category: "maintenance",
          run: () => a?.postMessage({ type: "bisectReset" }),
        },
        // Abort operations
        {
          id: "merge-abort",
          label: "Abort merge",
          keywords: "cancel conflict revert",
          category: "sync",
          run: () => a?.postMessage({ type: "mergeAbort" }),
        },
        {
          id: "rebase-abort",
          label: "Abort rebase",
          keywords: "cancel revert",
          category: "sync",
          run: () => a?.postMessage({ type: "rebaseAbort" }),
        },
        {
          id: "cherry-abort",
          label: "Abort cherry-pick",
          keywords: "cancel revert",
          category: "sync",
          run: () => a?.postMessage({ type: "cherryPickAbort" }),
        },
        {
          id: "revert-abort",
          label: "Abort revert",
          keywords: "cancel undo",
          category: "sync",
          run: () => a?.postMessage({ type: "revertAbort" }),
        },
        // Submodule
        {
          id: "submodule-update",
          label: "Update submodules",
          keywords: "dependencies init",
          category: "maintenance",
          run: () => a?.postMessage({ type: "submoduleUpdate" }),
        }
      );
    }
    return list;
  }, [props.api, props.hasRepo]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let result = items;
    if (t) {
      result = items.filter(
        (i) =>
          i.label.toLowerCase().includes(t) ||
          i.keywords.toLowerCase().includes(t) ||
          i.id.includes(t) ||
          i.category.includes(t)
      );
    }
    if (activeCategory) {
      result = result.filter((i) => i.category === activeCategory);
    }
    return result;
  }, [items, q, activeCategory]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const flatOrdered = useMemo(() => {
    const out: Item[] = [];
    for (const [, categoryItems] of Object.entries(groupedItems)) {
      out.push(...categoryItems);
    }
    return out;
  }, [groupedItems]);

  if (!props.open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/50 pt-[8vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-orange-500/30 bg-neutral-900 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-neutral-800 px-4">
          <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            className="w-full border-none bg-transparent px-3 py-4 text-sm text-white placeholder-neutral-500 outline-none"
            placeholder="Search git commands..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                props.onClose();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, flatOrdered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (flatOrdered[activeIdx]) {
                  flatOrdered[activeIdx].run();
                  props.onClose();
                }
              }
            }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-neutral-400 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 border-b border-neutral-800 px-2 py-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {(() => {
            let flatIdx = 0;
            return Object.entries(groupedItems).map(([category, categoryItems]) => (
              <li key={category}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {categories.find((c) => c.id === category)?.label || category}
                </div>
                {categoryItems.map((i) => {
                  const idx = flatIdx++;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      ref={(el) => {
                        if (isActive && el) {
                          el.scrollIntoView({ block: "nearest" });
                        }
                      }}
                      className={[
                        "flex w-full items-center justify-between px-4 py-2.5 text-left",
                        isActive ? "bg-orange-500/20 text-white" : "hover:bg-neutral-800",
                      ].join(" ")}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        i.run();
                        props.onClose();
                      }}
                    >
                      <span className="text-sm font-medium text-neutral-200">{i.label}</span>
                      <span className="text-xs text-neutral-500">{i.sub}</span>
                    </button>
                  );
                })}
              </li>
            ));
          })()}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">
              No commands found
            </li>
          ) : null}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-2 text-[10px] text-neutral-500">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ctrl+K to open</span>
        </div>
      </div>
    </div>
  );
}
