import type { BranchFolder, Branch } from "../../types/git";

interface BranchRule {
  pattern: RegExp;
  folder: string;
  extract?: (match: RegExpMatchArray) => string;
}

const RULES: BranchRule[] = [
  { pattern: /^@(.+?)\//, folder: "By Owner", extract: (m) => m[1] },
  { pattern: /^([A-Z]+-\d+)\//, folder: "By Ticket", extract: (m) => m[1] },
  { pattern: /^(feature|feat)\//, folder: "Features" },
  { pattern: /^(bugfix|fix|bug)\//, folder: "Bug Fixes" },
  { pattern: /^(hotfix)\//, folder: "Hotfixes" },
  { pattern: /^(release)\//, folder: "Releases" },
  { pattern: /^(chore|refactor|docs|test|ci)\//, folder: "Maintenance" },
  { pattern: /^team-(.+?)\//, folder: "By Team", extract: (m) => m[1] },
  { pattern: /^service-(.+?)\//, folder: "By Service", extract: (m) => m[1] },
  { pattern: /^(.+?)\//, folder: "Other", extract: (m) => m[1] },
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function groupBranches(branches: Branch[]): BranchFolder[] {
  const folderMap = new Map<string, string[]>();

  for (const branch of branches) {
    if (branch.isRemote) continue;

    const name = branch.name;
    let assigned = false;

    for (const rule of RULES) {
      const match = name.match(rule.pattern);
      if (match) {
        const folderName = rule.extract ? rule.extract(match) : rule.folder;
        const existing = folderMap.get(folderName) || [];
        existing.push(name);
        folderMap.set(folderName, existing);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const existing = folderMap.get("Other") || [];
      existing.push(name);
      folderMap.set("Other", existing);
    }
  }

  const now = Date.now();
  const folders: BranchFolder[] = [];

  for (const [name, branchNames] of folderMap) {
    const branchList = branches.filter((b) => branchNames.includes(b.name));
    
    let staleCount = 0;
    let activeCount = 0;

    for (const branch of branchList) {
      if (branch.lastCommitDate) {
        if (now - branch.lastCommitDate > THIRTY_DAYS_MS) {
          staleCount++;
        } else {
          activeCount++;
        }
      }
    }

    folders.push({
      name,
      branches: branchNames,
      collapsed: false,
      color: getFolderColor(name),
    });
  }

  return folders.sort((a, b) => a.name.localeCompare(b.name));
}

function getFolderColor(folderName: string): string {
  const colors: Record<string, string> = {
    "Features": "#10B981",
    "Bug Fixes": "#EF4444",
    "Hotfixes": "#F59E0B",
    "Releases": "#8B5CF6",
    "Maintenance": "#6B7280",
    "By Owner": "#3B82F6",
    "By Ticket": "#EC4899",
    "By Team": "#14B8A6",
    "By Service": "#F97316",
    "Other": "#64748B",
  };

  return colors[folderName] || "#64748B";
}

export function detectBranchType(branchName: string): string {
  for (const rule of RULES) {
    if (rule.pattern.test(branchName)) {
      return rule.folder;
    }
  }
  return "Other";
}

export function isBranchStale(branch: Branch): boolean {
  if (!branch.lastCommitDate) return false;
  return Date.now() - branch.lastCommitDate > THIRTY_DAYS_MS;
}
