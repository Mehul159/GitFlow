import { useState } from "react";
import { useCommitStore, useUIStore } from "../../store";
import Badge from "../../../components/ui/badge";

interface BisectState {
  active: boolean;
  goodRef: string | null;
  badRef: string | null;
  currentTest: string | null;
  steps: number;
  history: { sha: string; result: "good" | "bad" }[];
}

export function BisectWizard() {
  const { commits } = useCommitStore();
  const { addToast } = useUIStore();
  const [bisect, setBisect] = useState<BisectState>({
    active: false,
    goodRef: null,
    badRef: null,
    currentTest: null,
    steps: 0,
    history: [],
  });

  const startBisect = (bad: string, good: string) => {
    setBisect({
      active: true,
      goodRef: good,
      badRef: bad,
      currentTest: bad,
      steps: 0,
      history: [],
    });
    addToast("info", `Bisect started: bad=${bad.slice(0, 7)}, good=${good.slice(0, 7)}`);
  };

  const markGood = (sha: string) => {
    if (!bisect.active) return;
    const newHistory = [...bisect.history, { sha, result: "good" as const }];
    const currentIndex = commits.findIndex((c) => c.hash === sha);
    const nextTest = commits.slice(0, currentIndex)[Math.floor(currentIndex / 2)];

    setBisect({
      ...bisect,
      history: newHistory,
      currentTest: nextTest?.hash || null,
      steps: bisect.steps + 1,
    });

    if (!nextTest) {
      addToast("success", `First bad commit found: ${sha.slice(0, 7)}`);
      resetBisect();
    }
  };

  const markBad = (sha: string) => {
    if (!bisect.active) return;
    const newHistory = [...bisect.history, { sha, result: "bad" as const }];
    const currentIndex = commits.findIndex((c) => c.hash === sha);
    const nextTest = commits.slice(currentIndex + 1)[Math.floor((commits.length - currentIndex) / 2)];

    setBisect({
      ...bisect,
      history: newHistory,
      currentTest: nextTest?.hash || null,
      steps: bisect.steps + 1,
    });

    if (!nextTest) {
      addToast("success", `First bad commit found: ${sha.slice(0, 7)}`);
      resetBisect();
    }
  };

  const resetBisect = () => {
    setBisect({
      active: false,
      goodRef: null,
      badRef: null,
      currentTest: null,
      steps: 0,
      history: [],
    });
  };

  if (!bisect.active) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="text-sm font-medium text-gfs-text">Bisect Wizard</div>
        <p className="text-xs text-gfs-muted">
          Use binary search to find the first commit that introduced a bug.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded-lg bg-gfs-surface2 px-3 py-2 text-xs text-gfs-text"
            onChange={(e) => {
              const bad = e.target.value;
              const goodEl = document.getElementById("bisect-good") as HTMLSelectElement;
              if (goodEl?.value) {
                startBisect(bad, goodEl.value);
              }
            }}
          >
            <option value="">Select bad commit...</option>
            {commits.slice(0, 20).map((c) => (
              <option key={c.hash} value={c.hash}>
                {c.hash.slice(0, 7)} - {c.subject.slice(0, 30)}
              </option>
            ))}
          </select>
          <select id="bisect-good" className="rounded-lg bg-gfs-surface2 px-3 py-2 text-xs text-gfs-text">
            <option value="">Select good commit...</option>
            {commits.slice(0, 20).map((c) => (
              <option key={c.hash} value={c.hash}>
                {c.hash.slice(0, 7)} - {c.subject.slice(0, 30)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gfs-text">Bisecting</div>
        <Badge variant="warning" size="sm">{bisect.steps} steps</Badge>
      </div>

      {bisect.currentTest && (
        <div className="rounded-lg bg-gfs-surface2 p-4">
          <div className="mb-2 text-xs text-gfs-muted">Test this commit:</div>
          <div className="font-mono text-xs text-gfs-accent">
            {bisect.currentTest.slice(0, 7)}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/30 hover:bg-green-500/30"
              onClick={() => markGood(bisect.currentTest!)}
            >
              Mark Good
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/30"
              onClick={() => markBad(bisect.currentTest!)}
            >
              Mark Bad
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-xs font-medium text-gfs-muted">History:</div>
        {bisect.history.slice().reverse().map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-gfs-text">{h.sha.slice(0, 7)}</span>
            <Badge variant={h.result === "good" ? "success" : "error"} size="sm">
              {h.result}
            </Badge>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="rounded-lg bg-gfs-surface2 px-3 py-2 text-xs text-gfs-muted hover:bg-gfs-surface2/80"
        onClick={resetBisect}
      >
        Reset Bisect
      </button>
    </div>
  );
}
