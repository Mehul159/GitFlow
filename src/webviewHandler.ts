import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execGit, GitError } from "./git/execGit";
import { loadGraph, loadStatus } from "./git/graph";
import { loadRepoExtras } from "./git/extras";
import type { WebviewToHost, HostToWebview } from "./messages";
import { suggestCommitMessage } from "./ai/suggestCommit";
import {
  isSafeGitObjectId,
  isSafeGitRefName,
  isSafeGitRev,
  isSafeRemoteName,
} from "./git/refValidation";

const DOC_LIMIT = 450_000;

export interface WebviewHandlerContext {
  webview: vscode.Webview;
  workspaceRoot: string | null;
  getGitRoot: () => string | null;
  maxCommits: () => number;
  postConfig: () => void;
  loadedCommits?: number;
}

function toast(
  webview: vscode.Webview,
  level: "info" | "error",
  message: string
): void {
  webview.postMessage({ type: "toast", level, message } satisfies HostToWebview);
}

function truncateDoc(body: string): string {
  if (body.length <= DOC_LIMIT) {
    return body;
  }
  return `${body.slice(0, DOC_LIMIT)}\n\n… truncated (${body.length} chars total)`;
}

async function localBranchExists(
  root: string,
  branch: string
): Promise<boolean> {
  try {
    await execGit(root, ["show-ref", "--verify", `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

export async function pushFullSync(ctx: WebviewHandlerContext): Promise<void> {
  const root = ctx.getGitRoot();
  const max = ctx.maxCommits();

  if (!root) {
    ctx.webview.postMessage({
      type: "graph",
      payload: null,
      error: "No Git repository found. Make sure you have a Git repository open.",
    } satisfies HostToWebview);
    ctx.webview.postMessage({
      type: "status",
      payload: null,
      error: "No Git repository",
    } satisfies HostToWebview);
    ctx.webview.postMessage({
      type: "extras",
      payload: null,
      error: "No Git repository",
    } satisfies HostToWebview);
    return;
  }
  try {
    const graph = await loadGraph(root, max);
    ctx.webview.postMessage({ type: "graph", payload: graph } satisfies HostToWebview);
  } catch (e: unknown) {
    const text =
      e instanceof GitError ? e.message : e instanceof Error ? e.message : String(e);
    ctx.webview.postMessage({
      type: "graph",
      payload: null,
      error: text,
    } satisfies HostToWebview);
  }
  try {
    const status = await loadStatus(root);
    ctx.webview.postMessage({ type: "status", payload: status } satisfies HostToWebview);
  } catch (e: unknown) {
    const text =
      e instanceof GitError ? e.message : e instanceof Error ? e.message : String(e);
    ctx.webview.postMessage({
      type: "status",
      payload: null,
      error: text,
    } satisfies HostToWebview);
  }
  try {
    const extras = await loadRepoExtras(root);
    ctx.webview.postMessage({ type: "extras", payload: extras } satisfies HostToWebview);
  } catch (e: unknown) {
    const text =
      e instanceof GitError ? e.message : e instanceof Error ? e.message : String(e);
    ctx.webview.postMessage({
      type: "extras",
      payload: null,
      error: text,
    } satisfies HostToWebview);
  }
}

async function pushSuggest(
  webview: vscode.Webview,
  root: string,
  cfg: vscode.WorkspaceConfiguration
): Promise<void> {
  let diff = "";
  try {
    diff = await execGit(root, ["diff", "--cached"]);
  } catch {
    webview.postMessage({
      type: "suggestResult",
      message: "",
      error: "Could not read staged diff.",
    } satisfies HostToWebview);
    return;
  }
  if (!diff.trim()) {
    webview.postMessage({
      type: "suggestResult",
      message: "",
      error: "Stage files before requesting an AI message.",
    } satisfies HostToWebview);
    return;
  }
  const gemini = cfg.get<string>("geminiApiKey")?.trim() ?? "";
  const groq = cfg.get<string>("groqApiKey")?.trim() ?? "";
  const result = await suggestCommitMessage(diff, { gemini, groq });
  webview.postMessage({
    type: "suggestResult",
    message: result.message,
    error: result.error,
  } satisfies HostToWebview);
}

function isValidStashIndex(index: unknown): index is number {
  return typeof index === "number" && Number.isInteger(index) && index >= 0;
}

function stashRef(index: number): string {
  return `stash@{${index}}`;
}

function cloneFolderName(url: string): string {
  try {
    const u = url.replace(/\.git\s*$/i, "").replace(/\/$/, "");
    const seg = u.split(/[/:]/).filter(Boolean);
    return seg[seg.length - 1] || "repo";
  } catch {
    return "repo";
  }
}

function safePathUnderRoot(root: string, rel: string): string | null {
  const full = path.normalize(path.join(root, rel));
  const base = path.normalize(root);
  const relTo = path.relative(base, full);
  if (relTo.startsWith("..") || path.isAbsolute(relTo)) {
    return null;
  }
  return full;
}

function isValidMessage(msg: unknown): msg is WebviewToHost {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return typeof m.type === "string" && m.type.length > 0;
}

export async function handleWebviewMessage(
  ctx: WebviewHandlerContext,
  msg: WebviewToHost
): Promise<void> {
  if (!isValidMessage(msg)) {
    return;
  }
  const ws = ctx.workspaceRoot;
  const cfg = vscode.workspace.getConfiguration("gitflow-studio");
  const pullRebase = Boolean(cfg.get<boolean>("pullWithRebase"));

  const needRoot = (): string | null => {
    const r = ctx.getGitRoot();
    if (!r) {
      toast(ctx.webview, "error", "No Git repository in this workspace.");
      return null;
    }
    return r;
  };

  try {
    switch (msg.type) {
      case "ready":
        ctx.postConfig();
        await pushFullSync(ctx);
        break;

      case "refresh":
        await pushFullSync(ctx);
        break;

      case "openSettings":
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "gitflow-studio"
        );
        break;

      case "openGitSettings":
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "git."
        );
        break;

      case "initRepo": {
        if (!ws) {
          toast(ctx.webview, "error", "Open a folder first.");
          return;
        }
        await execGit(ws, ["init"]);
        toast(ctx.webview, "info", "Git repository initialized.");
        await pushFullSync(ctx);
        break;
      }

      case "cloneRepo": {
        if (!ws) {
          toast(ctx.webview, "error", "Open a folder first.");
          return;
        }
        const url = msg.url.trim();
        if (!url || url.length > 2048 || url.startsWith("-") || url.includes("..")) {
          toast(ctx.webview, "error", "Invalid or empty clone URL.");
          return;
        }
        const name = cloneFolderName(url);
        const target = path.join(ws, name);
        if (fs.existsSync(target)) {
          toast(
            ctx.webview,
            "error",
            `Folder already exists: ${name}. Choose another parent or remove it.`
          );
          return;
        }
        await execGit(ws, ["clone", "--", url, name]);
        toast(
          ctx.webview,
          "info",
          `Cloned into ${name}. Open that folder if this workspace is the parent.`
        );
        await pushFullSync(ctx);
        break;
      }

      case "checkout": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.branch)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        await execGit(r, ["switch", msg.branch]);
        toast(ctx.webview, "info", `Checked out ${msg.branch}.`);
        await pushFullSync(ctx);
        break;
      }

      case "checkoutRemote": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const full = msg.name.trim();
        const slash = full.indexOf("/");
        if (slash < 0) {
          toast(ctx.webview, "error", "Use remote/branch form (e.g. origin/main).");
          return;
        }
        const remote = full.slice(0, slash);
        const branch = full.slice(slash + 1);
        if (!isSafeRemoteName(remote) || !isSafeGitRefName(branch)) {
          toast(ctx.webview, "error", "Invalid remote or branch name.");
          return;
        }
        await execGit(r, ["switch", "-c", branch, "--track", `${remote}/${branch}`]);
        toast(ctx.webview, "info", `Tracking ${full} as local ${branch}.`);
        await pushFullSync(ctx);
        break;
      }

      case "branchCreate": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.name)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        if (msg.startPoint?.trim() && !isSafeGitRefName(msg.startPoint.trim())) {
          toast(ctx.webview, "error", "Invalid start-point ref.");
          return;
        }
        if (msg.checkout) {
          const sw = ["switch", "-c", msg.name];
          if (msg.startPoint?.trim()) {
            sw.push(msg.startPoint.trim());
          }
          await execGit(r, sw);
          toast(ctx.webview, "info", `Created and checked out ${msg.name}.`);
        } else {
          const args = ["branch", msg.name];
          if (msg.startPoint?.trim()) {
            args.push(msg.startPoint.trim());
          }
          await execGit(r, args);
          toast(ctx.webview, "info", `Created branch ${msg.name}.`);
        }
        await pushFullSync(ctx);
        break;
      }

      case "branchDelete": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.name)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        await execGit(r, [
          "branch",
          msg.force ? "-D" : "-d",
          msg.name,
        ]);
        toast(ctx.webview, "info", `Deleted branch ${msg.name}.`);
        await pushFullSync(ctx);
        break;
      }

      case "branchRename": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.oldName) || !isSafeGitRefName(msg.newName)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        await execGit(r, ["branch", "-m", msg.oldName, msg.newName]);
        toast(ctx.webview, "info", `Renamed branch to ${msg.newName}.`);
        await pushFullSync(ctx);
        break;
      }

      case "stage": {
        const r = needRoot();
        if (!r || msg.paths.length === 0) {
          return;
        }
        const safePaths = msg.paths.filter((p: string) => safePathUnderRoot(r, p) !== null);
        if (safePaths.length === 0) {
          toast(ctx.webview, "error", "All paths are outside the repository.");
          return;
        }
        await execGit(r, ["add", "--", ...safePaths]);
        await pushFullSync(ctx);
        break;
      }

      case "unstage": {
        const r = needRoot();
        if (!r) {
          return;
        }
        let skippedCount = 0;
        for (const p of msg.paths) {
          if (safePathUnderRoot(r, p) === null) {
            skippedCount++;
            continue;
          }
          await execGit(r, ["restore", "--staged", "--", p]);
        }
        if (skippedCount > 0) {
          toast(ctx.webview, "error", `${skippedCount} path(s) skipped — outside the repository.`);
        }
        await pushFullSync(ctx);
        break;
      }

      case "stageAll": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["add", "-A"]);
        await pushFullSync(ctx);
        break;
      }

      case "discard": {
        const r = needRoot();
        if (!r || msg.paths.length === 0) {
          return;
        }
        const safeDiscard = msg.paths.filter((p: string) => safePathUnderRoot(r, p) !== null);
        if (safeDiscard.length === 0) {
          toast(ctx.webview, "error", "All paths are outside the repository.");
          return;
        }
        await execGit(r, ["restore", "--worktree", "--", ...safeDiscard]);
        toast(ctx.webview, "info", "Discarded working tree changes for selected files.");
        await pushFullSync(ctx);
        break;
      }

      case "removeFromIndex": {
        const r = needRoot();
        if (!r || msg.paths.length === 0) {
          return;
        }
        const safeRm = msg.paths.filter((p: string) => safePathUnderRoot(r, p) !== null);
        if (safeRm.length === 0) {
          toast(ctx.webview, "error", "All paths are outside the repository.");
          return;
        }
        await execGit(r, ["rm", "--cached", "--", ...safeRm]);
        await pushFullSync(ctx);
        break;
      }

      case "commit": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (msg.allTracked) {
          await execGit(r, ["commit", "-a", "-m", msg.message]);
        } else if (msg.amend) {
          await execGit(r, ["commit", "--amend", "-m", msg.message]);
        } else {
          await execGit(r, ["commit", "-m", msg.message]);
        }
        toast(ctx.webview, "info", msg.amend ? "Commit amended." : "Commit created.");
        await pushFullSync(ctx);
        break;
      }

      case "suggestCommit": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await pushSuggest(ctx.webview, r, cfg);
        break;
      }

      case "fetch": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (msg.remote && !isSafeRemoteName(msg.remote)) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        await execGit(r, msg.remote ? ["fetch", msg.remote] : ["fetch", "--all"]);
        toast(ctx.webview, "info", "Fetch complete.");
        await pushFullSync(ctx);
        break;
      }

      case "pull": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (msg.remote?.trim() && !isSafeRemoteName(msg.remote.trim())) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        if (msg.branch?.trim() && !isSafeGitRefName(msg.branch.trim())) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        const rb = msg.rebase ?? pullRebase;
        const args = ["pull"];
        if (rb) {
          args.push("--rebase");
        }
        if (msg.remote?.trim()) {
          args.push(msg.remote.trim());
        }
        if (msg.branch?.trim()) {
          args.push(msg.branch.trim());
        }
        await execGit(r, args);
        toast(ctx.webview, "info", "Pull complete.");
        await pushFullSync(ctx);
        break;
      }

      case "push": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (msg.remote?.trim() && !isSafeRemoteName(msg.remote.trim())) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        if (msg.branch?.trim() && !isSafeGitRefName(msg.branch.trim())) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        const args = ["push"];
        if (msg.force) {
          args.push("--force-with-lease");
        }
        if (msg.tags) {
          args.push("--tags");
        }
        if (msg.remote?.trim()) {
          args.push(msg.remote.trim());
        }
        if (msg.branch?.trim()) {
          args.push(msg.branch.trim());
        }
        try {
          await execGit(r, args);
          toast(ctx.webview, "info", "Push complete.");
          await pushFullSync(ctx);
        } catch (e) {
          if (e instanceof GitError && e.stderr?.includes("has no upstream branch")) {
            ctx.webview.postMessage({
              type: "pushNoUpstream",
              branch: msg.branch || (await execGit(r, ["rev-parse", "--abbrev-ref", "HEAD"])).trim(),
              remote: msg.remote || "origin",
            } satisfies HostToWebview);
          } else {
            throw e;
          }
        }
        break;
      }

      case "pushSetUpstream": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const remote = msg.remote?.trim() || "origin";
        const branch = msg.branch?.trim();
        if (!branch) {
          toast(ctx.webview, "error", "No branch specified.");
          return;
        }
        if (!isSafeRemoteName(remote)) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        if (!isSafeGitRefName(branch)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        const args = ["push", "-u", remote, branch];
        if (msg.force) {
          args.push("--force-with-lease");
        }
        await execGit(r, args);
        toast(ctx.webview, "info", `Pushed and set upstream for ${branch} to ${remote}/${branch}.`);
        await pushFullSync(ctx);
        break;
      }

      case "merge": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.branch)) {
          toast(ctx.webview, "error", "Invalid branch or ref name.");
          return;
        }
        if (msg.squash) {
          await execGit(r, ["merge", "--squash", msg.branch]);
          toast(
            ctx.webview,
            "info",
            "Squash merge staged. Review and commit from the Commit panel."
          );
        } else if (msg.noFf) {
          await execGit(r, ["merge", "--no-ff", msg.branch]);
          toast(ctx.webview, "info", "Merge complete.");
        } else {
          await execGit(r, ["merge", msg.branch]);
          toast(ctx.webview, "info", "Merge complete.");
        }
        await pushFullSync(ctx);
        break;
      }

      case "mergeBranches": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const into = msg.into.trim();
        const from = msg.from.trim();
        if (!isSafeGitRefName(into) || !isSafeGitRefName(from)) {
          toast(ctx.webview, "error", "Invalid branch or ref name.");
          ctx.webview.postMessage({
            type: "mergeResult",
            status: "error",
            message: "Invalid branch or ref name.",
          } satisfies HostToWebview);
          return;
        }
        if (!into || !from || into === from) {
          toast(ctx.webview, "error", "Invalid merge.");
          ctx.webview.postMessage({
            type: "mergeResult",
            status: "error",
            message: "Invalid branch selection.",
          } satisfies HostToWebview);
          return;
        }
        const intoOk = await localBranchExists(r, into);
        if (!intoOk) {
          const err = `Cannot merge into "${into}": that local branch does not exist. Check out or create it first.`;
          toast(ctx.webview, "error", err);
          ctx.webview.postMessage({
            type: "mergeResult",
            status: "error",
            message: err,
          } satisfies HostToWebview);
          return;
        }
        let prevBranch: string | null = null;
        try {
          prevBranch = (await execGit(r, ["branch", "--show-current"])).trim() || null;
          if (prevBranch !== into) {
            await execGit(r, ["checkout", into]);
          }
          if (msg.squash) {
            await execGit(r, ["merge", "--squash", from]);
            toast(
              ctx.webview,
              "info",
              `Merged ${from} into ${into} (squash). Review and commit from the Commit panel.`
            );
          } else if (msg.noFf) {
            await execGit(r, ["merge", "--no-ff", from]);
            toast(ctx.webview, "info", `Merged ${from} into ${into}.`);
          } else {
            await execGit(r, ["merge", from]);
            toast(ctx.webview, "info", `Merged ${from} into ${into}.`);
          }
          await pushFullSync(ctx);
          ctx.webview.postMessage({
            type: "mergeResult",
            status: "ok",
          } satisfies HostToWebview);
        } catch (e: unknown) {
          const text =
            e instanceof GitError
              ? e.message
              : e instanceof Error
                ? e.message
                : String(e);
          await pushFullSync(ctx);
          const ex = await loadRepoExtras(r);
          const conflict =
            ex.mergeState.merging && ex.mergeState.conflictFiles.length > 0;

          if (!conflict && prevBranch && prevBranch !== into) {
            try {
              await execGit(r, ["checkout", prevBranch]);
            } catch { /* best-effort restore */ }
          }

          ctx.webview.postMessage({
            type: "mergeResult",
            status: conflict ? "conflict" : "error",
            message: text,
            conflictFiles: conflict
              ? ex.mergeState.conflictFiles
              : undefined,
          } satisfies HostToWebview);
          if (conflict) {
            toast(
              ctx.webview,
              "error",
              "Merge paused: resolve conflicts, then commit or abort."
            );
          } else {
            toast(ctx.webview, "error", text);
          }
        }
        break;
      }

      case "mergeAbort": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["merge", "--abort"]);
        toast(ctx.webview, "info", "Merge aborted.");
        await pushFullSync(ctx);
        break;
      }

      case "rebase": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const onto = msg.onto.trim();
        if (!isSafeGitRefName(onto)) {
          toast(ctx.webview, "error", "Invalid ref name.");
          return;
        }
        await execGit(r, ["rebase", onto]);
        toast(ctx.webview, "info", "Rebase complete.");
        await pushFullSync(ctx);
        break;
      }

      case "rebaseAbort": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["rebase", "--abort"]);
        toast(ctx.webview, "info", "Rebase aborted.");
        await pushFullSync(ctx);
        break;
      }

      case "cherryPick": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitObjectId(msg.hash)) {
          toast(ctx.webview, "error", "Invalid commit hash.");
          return;
        }
        await execGit(r, ["cherry-pick", msg.hash]);
        toast(ctx.webview, "info", "Cherry-pick complete.");
        await pushFullSync(ctx);
        break;
      }

      case "cherryPickAbort": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["cherry-pick", "--abort"]);
        toast(ctx.webview, "info", "Cherry-pick aborted.");
        await pushFullSync(ctx);
        break;
      }

      case "revertAbort": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["revert", "--abort"]);
        toast(ctx.webview, "info", "Revert aborted.");
        await pushFullSync(ctx);
        break;
      }

      case "reset": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const ref = msg.ref.trim();
        if (!isSafeGitRefName(ref)) {
          toast(ctx.webview, "error", "Invalid ref name.");
          return;
        }
        const flag =
          msg.mode === "soft" ? "--soft" : msg.mode === "hard" ? "--hard" : "--mixed";
        await execGit(r, ["reset", flag, ref]);
        toast(ctx.webview, "info", `Reset (${msg.mode}) complete.`);
        await pushFullSync(ctx);
        break;
      }

      case "stashPush": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (msg.message?.trim()) {
          await execGit(r, ["stash", "push", "-m", msg.message.trim()]);
        } else {
          await execGit(r, ["stash", "push"]);
        }
        toast(ctx.webview, "info", "Stash saved.");
        await pushFullSync(ctx);
        break;
      }

      case "stashPop": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isValidStashIndex(msg.index)) {
          toast(ctx.webview, "error", "Invalid stash index.");
          return;
        }
        await execGit(r, ["stash", "pop", stashRef(msg.index)]);
        toast(ctx.webview, "info", "Stash popped.");
        await pushFullSync(ctx);
        break;
      }

      case "stashApply": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isValidStashIndex(msg.index)) {
          toast(ctx.webview, "error", "Invalid stash index.");
          return;
        }
        await execGit(r, ["stash", "apply", stashRef(msg.index)]);
        toast(ctx.webview, "info", "Stash applied.");
        await pushFullSync(ctx);
        break;
      }

      case "stashDrop": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isValidStashIndex(msg.index)) {
          toast(ctx.webview, "error", "Invalid stash index.");
          return;
        }
        await execGit(r, ["stash", "drop", stashRef(msg.index)]);
        toast(ctx.webview, "info", "Stash dropped.");
        await pushFullSync(ctx);
        break;
      }

      case "stashClear": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["stash", "clear"]);
        toast(ctx.webview, "info", "All stashes cleared.");
        await pushFullSync(ctx);
        break;
      }

      case "stashBranch": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isValidStashIndex(msg.index)) {
          toast(ctx.webview, "error", "Invalid stash index.");
          return;
        }
        const bn = msg.branch.trim();
        if (!isSafeGitRefName(bn)) {
          toast(ctx.webview, "error", "Invalid branch name.");
          return;
        }
        await execGit(r, [
          "stash",
          "branch",
          bn,
          stashRef(msg.index),
        ]);
        toast(ctx.webview, "info", `Created branch ${msg.branch} from stash.`);
        await pushFullSync(ctx);
        break;
      }

      case "tagCreate": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const name = msg.name.trim();
        if (!isSafeGitRefName(name)) {
          toast(ctx.webview, "error", "Invalid tag name.");
          return;
        }
        const h = msg.hash?.trim();
        if (h && !isSafeGitObjectId(h)) {
          toast(ctx.webview, "error", "Invalid commit hash.");
          return;
        }
        if (msg.annotated && msg.message?.trim()) {
          const args = ["tag", "-a", name, "-m", msg.message.trim()];
          if (h) {
            args.push(h);
          }
          await execGit(r, args);
        } else {
          const args = ["tag", name];
          if (h) {
            args.push(h);
          }
          await execGit(r, args);
        }
        toast(ctx.webview, "info", `Tag ${name} created.`);
        await pushFullSync(ctx);
        break;
      }

      case "tagDelete": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitRefName(msg.name)) {
          toast(ctx.webview, "error", "Invalid tag name.");
          return;
        }
        await execGit(r, ["tag", "-d", msg.name]);
        toast(ctx.webview, "info", `Tag ${msg.name} deleted locally.`);
        await pushFullSync(ctx);
        break;
      }

      case "remoteAdd": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const rn = msg.name.trim();
        const url = msg.url.trim();
        if (!isSafeRemoteName(rn)) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        if (!url || url.length > 2048 || url.startsWith("-") || url.includes("..")) {
          toast(ctx.webview, "error", "Invalid remote URL.");
          return;
        }
        await execGit(r, ["remote", "add", rn, url]);
        toast(ctx.webview, "info", `Remote ${rn} added.`);
        await pushFullSync(ctx);
        break;
      }

      case "remoteRemove": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeRemoteName(msg.name)) {
          toast(ctx.webview, "error", "Invalid remote name.");
          return;
        }
        await execGit(r, ["remote", "remove", msg.name]);
        toast(ctx.webview, "info", `Remote ${msg.name} removed.`);
        await pushFullSync(ctx);
        break;
      }

      case "gitConfigSet": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["config", msg.key, msg.value.trim()]);
        toast(ctx.webview, "info", "Git configuration updated.");
        await pushFullSync(ctx);
        break;
      }

      case "submoduleUpdate": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const args = ["submodule", "update", "--recursive"];
        if (msg.init !== false) {
          args.push("--init");
        }
        await execGit(r, args);
        toast(ctx.webview, "info", "Submodules updated.");
        await pushFullSync(ctx);
        break;
      }

      case "cleanPreview": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const out = await execGit(r, ["clean", "-nd", "-f"]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: "git clean (dry run)",
          body: truncateDoc(out || "(nothing to clean)"),
          language: "log",
        } satisfies HostToWebview);
        break;
      }

      case "clean": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, msg.dirs === true ? ["clean", "-fd"] : ["clean", "-f"]);
        toast(ctx.webview, "info", "Clean complete.");
        await pushFullSync(ctx);
        break;
      }

      case "gc": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const out = await execGit(r, ["gc"]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: "git gc",
          body: truncateDoc(out || "Done."),
          language: "log",
        } satisfies HostToWebview);
        toast(ctx.webview, "info", "Garbage collection finished.");
        await pushFullSync(ctx);
        break;
      }

      case "fsck": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const out = await execGit(r, ["fsck", "--no-progress"]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: "git fsck",
          body: truncateDoc(out || "OK"),
          language: "log",
        } satisfies HostToWebview);
        break;
      }

      case "bisectStart": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["bisect", "start"]);
        toast(ctx.webview, "info", "Bisect started. Mark good/bad commits.");
        await pushFullSync(ctx);
        break;
      }

      case "bisectGood": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const ref = msg.ref?.trim();
        if (ref && !isSafeGitRev(ref)) {
          toast(ctx.webview, "error", "Invalid ref.");
          return;
        }
        await execGit(
          r,
          ref ? ["bisect", "good", ref] : ["bisect", "good"]
        );
        await pushFullSync(ctx);
        break;
      }

      case "bisectBad": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const ref = msg.ref?.trim();
        if (ref && !isSafeGitRev(ref)) {
          toast(ctx.webview, "error", "Invalid ref.");
          return;
        }
        await execGit(
          r,
          ref ? ["bisect", "bad", ref] : ["bisect", "bad"]
        );
        await pushFullSync(ctx);
        break;
      }

      case "bisectReset": {
        const r = needRoot();
        if (!r) {
          return;
        }
        await execGit(r, ["bisect", "reset"]);
        toast(ctx.webview, "info", "Bisect reset.");
        await pushFullSync(ctx);
        break;
      }

      case "noteAdd": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitObjectId(msg.hash)) {
          toast(ctx.webview, "error", "Invalid commit hash.");
          return;
        }
        await execGit(r, [
          "notes",
          "add",
          "-f",
          "-m",
          msg.message.trim(),
          msg.hash,
        ]);
        toast(ctx.webview, "info", "Note added to commit.");
        await pushFullSync(ctx);
        break;
      }

      case "getDiff": {
        const r = needRoot();
        if (!r) {
          return;
        }
        let body = "";
        if (msg.from && msg.to) {
          if (!isSafeGitRev(msg.from) || !isSafeGitRev(msg.to)) {
            toast(ctx.webview, "error", "Invalid revision in diff request.");
            return;
          }
          body = await execGit(r, ["diff", "--no-color", msg.from, msg.to]);
        } else if (msg.path) {
          if (safePathUnderRoot(r, msg.path) === null) {
            toast(ctx.webview, "error", "Invalid path.");
            return;
          }
          const args = ["diff", "--no-color"];
          if (msg.staged) {
            args.push("--cached");
          }
          args.push("--", msg.path);
          body = await execGit(r, args);
        } else {
          body = await execGit(r, ["diff", "--no-color"]);
        }
        ctx.webview.postMessage({
          type: "textDocument",
          title: msg.from && msg.to ? `diff ${msg.from}..${msg.to}` : "diff",
          body: truncateDoc(body),
          language: "diff",
        } satisfies HostToWebview);
        break;
      }

      case "getShow": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (!isSafeGitObjectId(msg.hash)) {
          toast(ctx.webview, "error", "Invalid commit hash.");
          return;
        }
        const body = await execGit(r, [
          "show",
          "--no-color",
          "--stat",
          "-p",
          msg.hash,
        ]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: `show ${msg.hash.slice(0, 7)}`,
          body: truncateDoc(body),
          language: "diff",
        } satisfies HostToWebview);
        break;
      }

      case "getBlame": {
        const r = needRoot();
        if (!r) {
          return;
        }
        if (safePathUnderRoot(r, msg.path) === null) {
          toast(ctx.webview, "error", "Invalid path.");
          return;
        }
        const body = await execGit(r, ["blame", "--date=short", "--", msg.path]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: `blame ${msg.path}`,
          body: truncateDoc(body),
          language: "log",
        } satisfies HostToWebview);
        break;
      }

      case "getShortlog": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const body = await execGit(r, ["shortlog", "-sne", "HEAD"]);
        ctx.webview.postMessage({
          type: "textDocument",
          title: "git shortlog",
          body: truncateDoc(body),
          language: "log",
        } satisfies HostToWebview);
        break;
      }

      case "openInEditor": {
        const r = needRoot();
        if (!r) {
          return;
        }
        const full = safePathUnderRoot(r, msg.path);
        if (!full) {
          toast(ctx.webview, "error", "Invalid path.");
          return;
        }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(full));
        await vscode.window.showTextDocument(doc);
        break;
      }

      case "loadMore": {
        const r = needRoot();
        if (!r) return;
        const prev = ctx.loadedCommits ?? ctx.maxCommits();
        const newMax = prev + 200;
        ctx.loadedCommits = newMax;
        try {
          const graph = await loadGraph(r, newMax);
          ctx.webview.postMessage({ type: "graph", payload: graph } satisfies HostToWebview);
        } catch (e: unknown) {
          const text =
            e instanceof GitError ? e.message : e instanceof Error ? e.message : String(e);
          toast(ctx.webview, "error", text);
        }
        break;
      }

      case "openExternalUrl": {
        const raw = msg.url.trim();
        let u: URL;
        try {
          u = new URL(raw);
        } catch {
          toast(ctx.webview, "error", "Invalid URL.");
          break;
        }
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          toast(ctx.webview, "error", "Only http(s) links are allowed.");
          break;
        }
        await vscode.env.openExternal(vscode.Uri.parse(raw));
        break;
      }

      default:
        break;
    }
  } catch (e: unknown) {
    const text =
      e instanceof GitError ? e.message : e instanceof Error ? e.message : String(e);
    toast(ctx.webview, "error", text);
  }
}
