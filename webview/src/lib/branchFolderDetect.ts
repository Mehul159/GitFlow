/** Auto-detect branch folder per PRD-style naming (Features, Hotfixes, Releases, Protected). */

export type BranchFolderId =
  | "features"
  | "hotfixes"
  | "releases"
  | "protected"
  | "other";

const PROTECTED_EXACT = new Set(
  ["main", "master", "develop", "trunk", "production", "prod", "staging", "release"].map(
    (s) => s.toLowerCase()
  )
);

export function detectBranchFolder(branchName: string): BranchFolderId {
  const n = branchName.trim();
  const lower = n.toLowerCase();

  if (PROTECTED_EXACT.has(lower)) {
    return "protected";
  }

  if (/^hotfix[\/-]/i.test(n)) {
    return "hotfixes";
  }

  if (/^release[\/-]/i.test(n) || /^v\d+\.\d+/i.test(n)) {
    return "releases";
  }

  if (
    /^feature[\/-]/i.test(n) ||
    /^feat[\/-]/i.test(n) ||
    /^bugfix[\/-]/i.test(n)
  ) {
    return "features";
  }

  return "other";
}

export const FOLDER_LABEL: Record<BranchFolderId, string> = {
  features: "Features",
  hotfixes: "Hotfixes",
  releases: "Releases",
  protected: "Protected",
  other: "Other",
};

export const FOLDER_ORDER: BranchFolderId[] = [
  "protected",
  "releases",
  "features",
  "hotfixes",
  "other",
];
