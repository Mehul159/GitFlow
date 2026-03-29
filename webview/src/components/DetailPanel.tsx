import { useEffect, useState } from "react";
import type { CommitRecord, GraphPayload } from "../types";

function formatTime(epoch: number): string {
  if (!epoch) {
    return "";
  }
  const d = new Date(epoch * 1000);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DetailPanel(props: {
  graph: GraphPayload | null;
  hash: string | null;
  onClose: () => void;
  api: { postMessage: (m: unknown) => void } | null;
}) {
  const commit: CommitRecord | null =
    props.hash && props.graph
      ? props.graph.commits.find((c) => c.hash === props.hash) ?? null
      : null;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [props.hash]);

  if (!commit) {
    return null;
  }

  const short = commit.hash.slice(0, 7);

  const copySha = () => {
    void navigator.clipboard.writeText(commit.hash).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetModes = ["soft", "mixed", "hard"] as const;

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(100%,380px)] flex-col border-l border-gfs-surface2 bg-gfs-surface/98 shadow-[-12px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-2 border-b border-gfs-surface2 px-4 py-3">
        <div>
          <div className="font-mono text-xs text-gfs-accent">{short}</div>
          <h2 className="mt-1 text-base font-semibold leading-snug text-gfs-text">
            {commit.subject || "(no subject)"}
          </h2>
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 text-gfs-muted hover:bg-gfs-surface2 hover:text-gfs-text"
          aria-label="Close"
          onClick={props.onClose}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gfs-surface2 px-3 py-2">
        <button
          type="button"
          className="rounded-md bg-gfs-surface2 px-2 py-1 text-[10px] font-medium text-gfs-text"
          onClick={copySha}
        >
          {copied ? "Copied" : "Copy SHA"}
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-accent/20 px-2 py-1 text-[10px] font-semibold text-gfs-accent"
          onClick={() =>
            props.api?.postMessage({ type: "getShow", hash: commit.hash })
          }
        >
          Patch
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-surface2 px-2 py-1 text-[10px] text-gfs-text"
          onClick={() =>
            props.api?.postMessage({ type: "cherryPick", hash: commit.hash })
          }
        >
          Cherry-pick
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-surface2 px-2 py-1 text-[10px] text-gfs-text"
          onClick={() => {
            const name = window.prompt("New branch at this commit:");
            if (!name?.trim()) {
              return;
            }
            props.api?.postMessage({
              type: "branchCreate",
              name: name.trim(),
              checkout: true,
              startPoint: commit.hash,
            });
          }}
        >
          Branch here
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-surface2 px-2 py-1 text-[10px] text-gfs-text"
          onClick={() => {
            const name = window.prompt("Tag name:");
            if (!name?.trim()) {
              return;
            }
            const ann = window.confirm("Annotated tag?");
            const msg = ann ? window.prompt("Tag message:") : "";
            props.api?.postMessage({
              type: "tagCreate",
              name: name.trim(),
              annotated: ann && Boolean(msg?.trim()),
              message: msg?.trim() || undefined,
              hash: commit.hash,
            });
          }}
        >
          Tag
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-surface2 px-2 py-1 text-[10px] text-gfs-text"
          onClick={() => {
            const note = window.prompt("Note text:");
            if (!note?.trim()) {
              return;
            }
            props.api?.postMessage({
              type: "noteAdd",
              hash: commit.hash,
              message: note.trim(),
            });
          }}
        >
          Note
        </button>
        <button
          type="button"
          className="rounded-md bg-gfs-warning/25 px-2 py-1 text-[10px] font-semibold text-gfs-warning"
          onClick={() => {
            const m = window.prompt(
              `Reset HEAD to ${short}\nType: soft | mixed | hard`,
              "mixed"
            )
              ?.trim()
              .toLowerCase();
            if (!m || !resetModes.includes(m as (typeof resetModes)[number])) {
              return;
            }
            if (
              !window.confirm(
                `Reset (${m}) to ${short}? This can discard work.`
              )
            ) {
              return;
            }
            props.api?.postMessage({
              type: "reset",
              mode: m as "soft" | "mixed" | "hard",
              ref: commit.hash,
            });
          }}
        >
          Reset…
        </button>
      </div>

      <div className="gfs-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Author
          </div>
          <div className="mt-1 text-gfs-text">{commit.author}</div>
          <div className="font-mono text-xs text-gfs-muted">{commit.email}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Date
          </div>
          <div className="mt-1 text-gfs-text">{formatTime(commit.date)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
            Parents
          </div>
          <ul className="mt-1 space-y-1 font-mono text-xs text-gfs-muted">
            {commit.parents.length === 0 ? (
              <li>root</li>
            ) : (
              commit.parents.map((p) => (
                <li key={p} className="truncate text-gfs-accent">
                  {p.slice(0, 7)}
                </li>
              ))
            )}
          </ul>
        </div>
        {commit.decoration ? (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
              Refs (log)
            </div>
            <p className="mt-1 break-words text-xs text-gfs-muted">
              {commit.decoration}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function CommitComposer(props: {
  hasRepo: boolean;
  api: { postMessage: (m: unknown) => void } | null;
  geminiConfigured: boolean;
  groqConfigured: boolean;
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [amend, setAmend] = useState(false);
  const [allTracked, setAllTracked] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const d = event.data;
      if (d?.type === "suggestResult") {
        setBusy(false);
        setHint(typeof d.error === "string" && d.error ? d.error : null);
        if (d.message && typeof d.message === "string") {
          setMsg(d.message);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const suggest = () => {
    if (!props.api || !props.hasRepo) {
      return;
    }
    setHint(null);
    setBusy(true);
    props.api.postMessage({ type: "suggestCommit" });
  };

  const commit = () => {
    if (!props.api || !props.hasRepo || !msg.trim()) {
      return;
    }
    props.api.postMessage({
      type: "commit",
      message: msg.trim(),
      amend: amend || undefined,
      allTracked: allTracked || undefined,
    });
    if (!amend) {
      setMsg("");
    }
  };

  return (
    <div className="border-t border-gfs-surface2 bg-gfs-bg/90 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gfs-muted">
          Commit
        </span>
        <div className="flex items-center gap-2">
          {!props.geminiConfigured && !props.groqConfigured ? (
            <button
              type="button"
              className="text-[11px] font-medium text-gfs-accent hover:underline"
              onClick={() => props.api?.postMessage({ type: "openSettings" })}
            >
              Add API key
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || !props.hasRepo}
            className="rounded-lg bg-gfs-primary px-2 py-1 text-[11px] font-medium text-gfs-text ring-1 ring-gfs-accent/30 hover:bg-gfs-primary/90 disabled:opacity-50"
            onClick={suggest}
          >
            {busy ? "…" : "AI suggest"}
          </button>
        </div>
      </div>
      <label className="mb-1 flex items-center gap-2 text-[11px] text-gfs-muted">
        <input
          type="checkbox"
          checked={amend}
          disabled={!props.hasRepo}
          onChange={(e) => {
            const v = e.target.checked;
            setAmend(v);
            if (v) {
              setAllTracked(false);
            }
          }}
        />
        Amend last commit
      </label>
      <label className="mb-2 flex items-center gap-2 text-[11px] text-gfs-muted">
        <input
          type="checkbox"
          checked={allTracked}
          disabled={!props.hasRepo}
          onChange={(e) => {
            const v = e.target.checked;
            setAllTracked(v);
            if (v) {
              setAmend(false);
            }
          }}
        />
        Commit all tracked files (-a)
      </label>
      {hint ? (
        <p className="mb-2 text-[11px] text-gfs-warning">{hint}</p>
      ) : null}
      <textarea
        className="mb-2 min-h-[72px] w-full resize-none rounded-gfs border border-gfs-surface2 bg-gfs-surface px-3 py-2 font-mono text-[12px] text-gfs-text outline-none ring-0 placeholder:text-gfs-muted focus:border-gfs-accent disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Conventional commit or free-form message…"
        value={msg}
        disabled={!props.hasRepo}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button
        type="button"
        className="w-full rounded-gfs bg-gfs-accent py-2 text-sm font-semibold text-white shadow-lg shadow-gfs-accent/20 hover:brightness-110 disabled:opacity-40"
        disabled={!props.hasRepo || !msg.trim()}
        onClick={commit}
      >
        {amend ? "Amend commit" : allTracked ? "Commit -a" : "Commit staged"}
      </button>
    </div>
  );
}
