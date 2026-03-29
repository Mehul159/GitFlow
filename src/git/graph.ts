import { execGit } from "./execGit";

export interface CommitRecord {
  hash: string;
  parents: string[];
  subject: string;
  author: string;
  email: string;
  date: number;
  decoration: string;
}

export interface RefRecord {
  name: string;
  fullName: string;
  hash: string;
  isRemote: boolean;
}

export interface GraphPayload {
  commits: CommitRecord[];
  refs: RefRecord[];
  head: string | null;
  branch: string | null;
  /** Set when the repo has no commits yet (HEAD is an unborn branch). */
  isEmptyRepo?: boolean;
}

const COMMIT_MARKER = "<GFS_COMMIT_END>";

async function repoHasCommits(repoRoot: string): Promise<boolean> {
  try {
    await execGit(repoRoot, ["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}

async function resolveCurrentBranch(repoRoot: string): Promise<string | null> {
  try {
    const b = (await execGit(repoRoot, ["branch", "--show-current"])).trim();
    if (b) {
      return b;
    }
  } catch {
    /* ignore */
  }
  try {
    const sym = (await execGit(repoRoot, ["symbolic-ref", "-q", "HEAD"]))
      .trim();
    const m = /^refs\/heads\/(.+)$/.exec(sym);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export async function loadGraph(
  repoRoot: string,
  maxCommits: number
): Promise<GraphPayload> {
  const hasCommits = await repoHasCommits(repoRoot);

  const commits: CommitRecord[] = [];
  if (hasCommits) {
    const fmt = [
      "%H",
      "%P",
      "%s",
      "%an",
      "%ae",
      "%ct",
      "%D",
      COMMIT_MARKER,
    ].join("%n");

    console.log("[GFS] Running git log command...");
    const logOut = await execGit(repoRoot, [
      "log",
      "--all",
      `--max-count=${maxCommits}`,
      `--pretty=format:${fmt}`,
      "--topo-order",
    ]);
    
    console.log("[GFS] Git log raw output length:", logOut.length);
    console.log("[GFS] Git log first 500 chars:", logOut.slice(0, 500));

    const blocks = logOut
      .split(COMMIT_MARKER)
      .map((b) => b.trim())
      .filter(Boolean);
    
    console.log("[GFS] Number of commit blocks:", blocks.length);

    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length < 6) {
        console.log("[GFS] Skipping commit block with less than 6 lines:", lines.length);
        continue;
      }
      const [hash, parentsLine, subject, author, email, ct, ...decRest] = lines;
      const decoration = decRest.join("\n");
      const parents = parentsLine.trim()
        ? parentsLine.trim().split(/\s+/)
        : [];
      commits.push({
        hash: hash.trim(),
        parents,
        subject: subject ?? "",
        author: author ?? "",
        email: email ?? "",
        date: Number(ct) || 0,
        decoration,
      });
    }
  }

  const refOut = await execGit(repoRoot, [
    "for-each-ref",
    "refs/heads",
    "refs/remotes",
    "refs/tags",
    "--format=%(objectname) %(refname)",
  ]);

  const refs: RefRecord[] = [];
  for (const line of refOut.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const sp = t.indexOf(" ");
    if (sp < 0) {
      continue;
    }
    const hash = t.slice(0, sp).trim();
    const fullName = t.slice(sp + 1).trim();
    const isRemote = fullName.startsWith("refs/remotes/");
    const short =
      fullName.replace(/^refs\/heads\//, "")
        .replace(/^refs\/remotes\//, "")
        .replace(/^refs\/tags\//, "tag:");
    refs.push({ hash, fullName, name: short, isRemote });
  }

  let head: string | null = null;
  let branch: string | null = null;

  if (hasCommits) {
    try {
      head = (await execGit(repoRoot, ["rev-parse", "HEAD"])).trim() || null;
      branch =
        (await execGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]))
          .trim() || null;
      if (branch === "HEAD") {
        branch = null;
      }
    } catch {
      head = null;
    }
  } else {
    branch = await resolveCurrentBranch(repoRoot);
  }

  return {
    commits,
    refs,
    head,
    branch,
    isEmptyRepo: !hasCommits,
  };
}

export interface FileStatusRow {
  path: string;
  staged: "M" | "A" | "D" | "R" | "C" | "U" | "?" | "";
  unstaged: "M" | "A" | "D" | "R" | "C" | "U" | "?" | "";
  display: string;
}

export async function loadStatus(
  repoRoot: string
): Promise<{ files: FileStatusRow[]; clean: boolean }> {
  const out = await execGit(repoRoot, ["status", "--porcelain"]);
  const files: FileStatusRow[] = [];
  for (const line of out.split("\n")) {
    if (line.length < 4) {
      continue;
    }
    const x = line[0];
    const y = line[1];
    let path = line.slice(3).trim();
    if (path.includes(" -> ")) {
      path = path.split(" -> ").pop()!.trim();
    }
    const staged = x === " " ? "" : (x as FileStatusRow["staged"]);
    const unstaged = y === " " ? "" : (y as FileStatusRow["unstaged"]);
    files.push({
      path,
      staged,
      unstaged,
      display: path,
    });
  }
  return { files, clean: files.length === 0 };
}
