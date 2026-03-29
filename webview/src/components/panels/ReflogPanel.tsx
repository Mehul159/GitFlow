import { useState, useMemo } from "react";
import type { ReflogRow } from "../../types/git";

interface ReflogPanelProps {
  reflog: ReflogRow[];
  onCheckout: (sha: string) => void;
}

export function ReflogPanel({ reflog, onCheckout }: ReflogPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredReflog = useMemo(() => {
    let results = reflog;

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.hash.toLowerCase().includes(searchLower) ||
          r.subject.toLowerCase().includes(searchLower) ||
          r.ref.toLowerCase().includes(searchLower)
      );
    }

    if (filter !== "all") {
      results = results.filter((r) => r.ref.includes(filter));
    }

    return results;
  }, [reflog, search, filter]);

  const operations = useMemo(() => {
    const ops = new Set<string>();
    reflog.forEach((r) => {
      const match = r.subject.match(/^(\w+):/);
      if (match) {
        ops.add(match[1]);
      }
    });
    return Array.from(ops).sort();
  }, [reflog]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gfs-surface2 p-2">
        <input
          type="text"
          placeholder="Search reflog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg bg-gfs-surface2 px-3 py-1.5 text-xs text-gfs-text placeholder-gfs-muted focus:outline-none focus:ring-1 focus:ring-gfs-accent"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg bg-gfs-surface2 px-2 py-1.5 text-xs text-gfs-text"
        >
          <option value="all">All</option>
          {operations.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      <div className="gfs-scroll min-h-0 flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-gfs-bg">
            <tr className="text-left text-[10px] uppercase tracking-wider text-gfs-muted">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">SHA</th>
              <th className="px-3 py-2 font-medium">Operation</th>
              <th className="px-3 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredReflog.map((entry, i) => {
              const opMatch = entry.subject.match(/^(\w+):/);
              const operation = opMatch ? opMatch[1] : "other";

              return (
                <tr
                  key={`${entry.hash}-${i}`}
                  className="border-b border-gfs-surface2/50 text-xs hover:bg-gfs-surface2/30"
                >
                  <td className="px-3 py-2 text-gfs-muted whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onCheckout(entry.hash)}
                      className="font-mono text-gfs-accent hover:underline"
                    >
                      {entry.hash.slice(0, 7)}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        operation === "commit"
                          ? "bg-green-500/20 text-green-400"
                          : operation === "checkout"
                          ? "bg-blue-500/20 text-blue-400"
                          : operation === "merge"
                          ? "bg-purple-500/20 text-purple-400"
                          : operation === "reset"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-gfs-surface2 text-gfs-muted"
                      }`}
                    >
                      {operation}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gfs-text truncate max-w-[200px]">
                    {entry.subject.replace(/^\w+: /, "")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredReflog.length === 0 && (
          <div className="p-4 text-center text-xs text-gfs-muted">
            No reflog entries found
          </div>
        )}
      </div>
    </div>
  );
}
