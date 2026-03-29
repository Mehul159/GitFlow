/** PRD branch-folder rules: auto grouping for local branch names. */
export function folderForBranch(name: string): string {
  if (name.startsWith("@")) {
    return "By owner";
  }
  if (/^[A-Z][A-Z0-9]+-\d+\//.test(name) || /^[A-Z]{2,}-\d+\//.test(name)) {
    return "Tickets";
  }
  const lower = name.toLowerCase();
  if (
    lower.startsWith("feature/") ||
    lower.startsWith("bugfix/") ||
    lower.startsWith("hotfix/") ||
    lower.startsWith("release/")
  ) {
    return "By type";
  }
  if (lower.startsWith("team-")) {
    return "Teams";
  }
  if (lower.startsWith("service-")) {
    return "Services";
  }
  return "Uncategorized";
}

export function groupBranches(names: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const n of names) {
    const f = folderForBranch(n);
    if (!groups[f]) {
      groups[f] = [];
    }
    groups[f].push(n);
  }
  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) => a.localeCompare(b));
  }
  return groups;
}
