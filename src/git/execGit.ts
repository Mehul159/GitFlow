import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class GitError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly stderr?: string
  ) {
    super(message);
    this.name = "GitError";
  }
}

export async function execGit(
  cwd: string,
  args: string[],
  options: { maxBuffer?: number } = {}
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout.toString();
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException & {
      stderr?: Buffer;
      code?: string | number;
    };
    const stderr = err.stderr?.toString() ?? "";
    if (err.code === "ENOENT") {
      throw new GitError(
        "Git executable not found. Install Git and ensure it is on your PATH.",
        "ENOENT"
      );
    }
    throw new GitError(
      stderr.trim() || err.message || "Git command failed",
      String(err.code),
      stderr
    );
  }
}

