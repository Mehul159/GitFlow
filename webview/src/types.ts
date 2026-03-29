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
  /** True when there are no commits yet (unborn HEAD). */
  isEmptyRepo?: boolean;
}

export interface FileStatusRow {
  path: string;
  staged: string;
  unstaged: string;
  display: string;
}

export interface StatusPayload {
  files: FileStatusRow[];
  clean: boolean;
}

export interface StashRow {
  id: string;
  index: number;
  hash: string;
  subject: string;
}

export interface RemoteRow {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface TagRow {
  name: string;
  hash: string;
  subject: string;
}

export interface ReflogRow {
  hash: string;
  ref: string;
  subject: string;
  date: number;
}

export interface SubmoduleRow {
  path: string;
  url: string;
  sha: string;
}

export interface WorktreeRow {
  path: string;
  head: string;
  branch: string;
}

export interface MergeState {
  merging: boolean;
  rebasing: boolean;
  cherryPick: boolean;
  revert: boolean;
  conflictFiles: string[];
}

export interface AheadBehind {
  upstream: string | null;
  ahead: number;
  behind: number;
}

export interface GitUserConfig {
  userName: string;
  userEmail: string;
}

export interface RepoExtrasPayload {
  stash: StashRow[];
  remotes: RemoteRow[];
  tags: TagRow[];
  reflog: ReflogRow[];
  mergeState: MergeState;
  submodules: SubmoduleRow[];
  worktrees: WorktreeRow[];
  config: GitUserConfig;
  aheadBehind: AheadBehind | null;
}
