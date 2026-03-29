/**
 * Quick check: empty repo + one-commit repo load without throw.
 * Run from repo root after `npm run compile`: npm run smoke
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { loadGraph } = require("../out/git/graph");
const { loadRepoExtras } = require("../out/git/extras");

function runGit(cwd, args) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

async function main() {
  const root = fs.mkdtempSync(path.join(require("os").tmpdir(), "gfs-smoke-"));

  runGit(root, ["init", "-b", "smoke"]);
  let g = await loadGraph(root, 100);
  let x = await loadRepoExtras(root);
  if (!g.isEmptyRepo || g.commits.length !== 0) {
    throw new Error("Expected empty repo");
  }
  if (x.reflog.length) {
    console.warn("warn: reflog non-empty on empty repo (ok)");
  }

  fs.writeFileSync(path.join(root, "a.txt"), "1");
  runGit(root, ["add", "a.txt"]);
  runGit(root, ["-c", "user.email=s@test", "-c", "user.name=S", "commit", "-m", "c1"]);

  g = await loadGraph(root, 100);
  x = await loadRepoExtras(root);
  if (g.isEmptyRepo || g.commits.length !== 1) {
    throw new Error("Expected one commit");
  }
  if (!x.reflog.length) {
    throw new Error("Expected reflog after commit");
  }

  console.log("smoke-git-load: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
