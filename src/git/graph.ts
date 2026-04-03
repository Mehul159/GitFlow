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
const FIELD_SEP = "\x00";

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
    ].join("%x00") + "%n" + COMMIT_MARKER;

    const logOut = await execGit(repoRoot, [
      "log",
      "--all",
      `--max-count=${maxCommits}`,
      `--pretty=format:${fmt}`,
      "--topo-order",
    ]);

    const blocks = logOut
      .split(COMMIT_MARKER)
      .map((b) => b.trim())
      .filter(Boolean);

    for (const block of blocks) {
      const fields = block.split(FIELD_SEP);
      if (fields.length < 7) {
        continue;
      }
      const [hash, parentsLine, subject, author, email, ct, decoration] = fields;
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
        decoration: decoration ?? "",
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
  const out = await execGit(repoRoot, ["status", "--porcelain", "-z"]);
  const files: FileStatusRow[] = [];
  const entries = out.split("\0");
  let i = 0;
  while (i < entries.length) {
    const entry = entries[i];
    if (entry.length < 3) {
      i++;
      continue;
    }
    const x = entry[0];
    const y = entry[1];
    let filePath = entry.slice(3);
    const isRename = x === "R" || x === "C" || y === "R" || y === "C";
    if (isRename && i + 1 < entries.length) {
      filePath = entries[i + 1];
      i++;
    }
    const staged = x === " " ? "" : (x as FileStatusRow["staged"]);
    const unstaged = y === " " ? "" : (y as FileStatusRow["unstaged"]);
    files.push({
      path: filePath,
      staged,
      unstaged,
      display: filePath,
    });
    i++;
  }
  return { files, clean: files.length === 0 };
}
