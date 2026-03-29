/// <reference lib="webworker" />

import git from "isomorphic-git";
import FS from "@isomorphic-git/lightning-fs";

const fs = new FS("gitfs");
const pfs = fs.promises;

interface GitWorkerRequest {
  id: string;
  method: string;
  args: unknown[];
}

interface GitWorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

async function handleGitOperation(
  method: string,
  args: unknown[]
): Promise<unknown> {
  const repoPath = args[0] as string;

  switch (method) {
    case "log": {
      const options = args[2] as { depth?: number; since?: string } || {};
      const commits = await git.log({
        fs: pfs,
        dir: repoPath,
        depth: options.depth || 100,
        since: options.since,
      });
      return commits;
    }

    case "status": {
      const matrix = await git.statusMatrix({ fs: pfs, dir: repoPath });
      return matrix;
    }

    case "branch": {
      const branches = await git.listBranches({ fs: pfs, dir: repoPath });
      return branches;
    }

    case "currentBranch": {
      const branch = await git.currentBranch({ fs: pfs, dir: repoPath });
      return branch;
    }

    case "commit": {
      const { message, author } = args[1] as { message: string; author?: { name: string; email: string } };
      const sha = await git.commit({
        fs: pfs,
        dir: repoPath,
        message,
        author: author || {},
      });
      return sha;
    }

    case "add": {
      const filepath = args[1] as string;
      await git.add({
        fs: pfs,
        dir: repoPath,
        filepath,
      });
      return true;
    }

    case "reset": {
      const filepath = args[1] as string;
      await git.resetIndex({
        fs: pfs,
        dir: repoPath,
        filepath,
      });
      return true;
    }

    case "checkout": {
      const ref = args[1] as string;
      await git.checkout({
        fs: pfs,
        dir: repoPath,
        ref,
      });
      return true;
    }

    case "branchCreate": {
      const { name, startPoint } = args[1] as { name: string; startPoint?: string };
      await git.branch({
        fs: pfs,
        dir: repoPath,
        ref: name,
        checkout: true,
        object: startPoint,
      });
      return true;
    }

    case "branchDelete": {
      const name = args[1] as string;
      await git.deleteBranch({
        fs: pfs,
        dir: repoPath,
        ref: name,
      });
      return true;
    }

    case "merge": {
      const { theirs, message } = args[1] as { theirs: string; message: string };
      const sha = await git.merge({
        fs: pfs,
        dir: repoPath,
        ours: await git.currentBranch({ fs: pfs, dir: repoPath }) || "HEAD",
        theirs,
        message,
      });
      return sha;
    }

    case "fetch": {
      const { remote, url } = args[1] as { remote?: string; url?: string };
      await git.fetch({
        fs: pfs,
        dir: repoPath,
        remote: remote || "origin",
        url,
      });
      return true;
    }

    case "push": {
      const { remote, ref, force } = args[1] as { remote?: string; ref?: string; force?: boolean };
      await git.push({
        fs: pfs,
        dir: repoPath,
        remote: remote || "origin",
        ref: ref || "main",
        force: force || false,
      });
      return true;
    }

    case "pull": {
      const { remote, branch } = args[1] as { remote?: string; branch?: string };
      await git.pull({
        fs: pfs,
        dir: repoPath,
        remote: remote || "origin",
        author: {},
      });
      return true;
    }

    case "tag": {
      const { name, message, sha } = args[1] as { name: string; message?: string; sha?: string };
      await git.tag({
        fs: pfs,
        dir: repoPath,
        ref: sha || "HEAD",
        message,
        tagger: {},
      });
      return name;
    }

    case "deleteTag": {
      const name = args[1] as string;
      await git.deleteTag({
        fs: pfs,
        dir: repoPath,
        ref: name,
      });
      return true;
    }

    case "remote": {
      const remotes = await git.listRemotes({ fs: pfs, dir: repoPath });
      return remotes;
    }

    case "addRemote": {
      const { name, url } = args[1] as { name: string; url: string };
      await git.addRemote({
        fs: pfs,
        dir: repoPath,
        remote: name,
        url,
      });
      return true;
    }

    case "removeRemote": {
      const name = args[1] as string;
      await git.deleteRemote({
        fs: pfs,
        dir: repoPath,
        remote: name,
      });
      return true;
    }

    case "diff": {
      const { sha1, sha2 } = args[1] as { sha1?: string; sha2?: string };
      if (sha1 && sha2) {
        const changes = await git.walk({
          fs: pfs,
          dir: repoPath,
          trees: [git.TREE({ ref: sha1 }), git.TREE({ ref: sha2 })],
          map: async function(filepath, [A, B]) {
            if (filepath === ".") return;
            const Aoid = await A?.oid();
            const Boid = await B?.oid();
            if (Aoid !== Boid) {
              return { path: filepath, A: Aoid, B: Boid };
            }
          },
        });
        return changes;
      }
      return [];
    }

    case "readCommit": {
      const sha = args[1] as string;
      const commit = await git.readCommit({ fs: pfs, dir: repoPath, oid: sha });
      return commit;
    }

    case "init": {
      await git.init({ fs: pfs, dir: repoPath });
      return true;
    }

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

self.onmessage = async (event: MessageEvent<GitWorkerRequest>) => {
  const { id, method, args } = event.data;

  try {
    const data = await handleGitOperation(method, args);
    const response: GitWorkerResponse = {
      id,
      success: true,
      data,
    };
    self.postMessage(response);
  } catch (error) {
    const response: GitWorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
