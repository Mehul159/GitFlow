import { useMemo, useState } from "react";
import type { CommitRecord } from "../../types/git";

interface AuthorStats {
  name: string;
  email: string;
  count: number;
  commits: string[];
}

interface TeamStatsProps {
  commits: CommitRecord[];
}

export function TeamStats({ commits }: TeamStatsProps) {
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);

  const stats = useMemo(() => {
    const now = Date.now();
    const cutoff = now - timeRange * 24 * 60 * 60 * 1000;

    const recentCommits = commits.filter((c) => c.date >= cutoff);

    const authorMap = new Map<string, AuthorStats>();

    for (const commit of recentCommits) {
      const key = commit.email.toLowerCase();
      const existing = authorMap.get(key);

      if (existing) {
        existing.count++;
        existing.commits.push(commit.hash);
      } else {
        authorMap.set(key, {
          name: commit.author,
          email: commit.email,
          count: 1,
          commits: [commit.hash],
        });
      }
    }

    return Array.from(authorMap.values()).sort((a, b) => b.count - a.count);
  }, [commits, timeRange]);

  const totalCommits = stats.reduce((sum, a) => sum + a.count, 0);

  const getAvatarUrl = (email: string) => {
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
  };

  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-gfs-surface2 p-3">
        <div className="text-sm font-medium text-gfs-text">Team Stats</div>
        <div className="flex gap-1">
          {([30, 60, 90] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setTimeRange(days)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                timeRange === days
                  ? "bg-ignite/20 text-ignite"
                  : "text-gfs-muted hover:bg-gfs-surface2"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-b border-gfs-surface2 px-3 py-2">
        <div className="text-xs text-gfs-muted">
          {totalCommits} commits from {stats.length} contributors
        </div>
      </div>

      <div className="gfs-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {stats.map((author) => {
            const barWidth = (author.count / maxCount) * 100;

            return (
              <div key={author.email} className="group">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(author.email)}
                    alt={author.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gfs-text">
                        {author.name}
                      </span>
                      <span className="text-xs text-gfs-muted">
                        {author.count} commits
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gfs-surface2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-ignite to-ignite/60"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stats.length === 0 && (
          <div className="flex h-32 items-center justify-center text-xs text-gfs-muted">
            No commits in this time range
          </div>
        )}
      </div>
    </div>
  );
}
