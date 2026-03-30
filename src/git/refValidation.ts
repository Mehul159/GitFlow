/**
 * Rejects strings that could be interpreted as git CLI flags or embed control bytes.
 * Branch names and remote refs (e.g. origin/main) are passed as argv — must not start with "-".
 */
export function isSafeGitRefName(name: string): boolean {
  const t = name.trim();
  if (!t || t.length > 512) {
    return false;
  }
  if (t.startsWith("-")) {
    return false;
  }
  if (/[\x00-\x1f\x7f]/.test(t)) {
    return false;
  }
  if (t.includes("..")) {
    return false;
  }
  return true;
}

/** Short SHA / full object id for cherry-pick, reset, show, etc. */
export function isSafeGitObjectId(hash: string): boolean {
  const t = hash.trim();
  return /^[0-9a-f]{7,64}$/i.test(t);
}

export function assertSafeRef(name: string, _label: string): string | null {
  if (!isSafeGitRefName(name)) {
    return null;
  }
  return name.trim();
}

/** Remote name (origin, upstream) — no flag-like values. */
export function isSafeRemoteName(name: string): boolean {
  const t = name.trim();
  if (!t || t.length > 256) {
    return false;
  }
  return /^[a-zA-Z0-9_.-]+$/.test(t);
}

/** Rev for diff/cherry-pick: full/short SHA or a named ref. */
export function isSafeGitRev(rev: string): boolean {
  const t = rev.trim();
  return isSafeGitObjectId(t) || isSafeGitRefName(t);
}
