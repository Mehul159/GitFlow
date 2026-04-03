# GitFlow Studio — Complete Backend Generation Prompt

> **Copy this entire prompt into Claude, Cursor, or GitHub Copilot to generate the full backend.**
> Priority: Maximum functionality + minimum RAM/CPU usage at runtime.

---

## MASTER PROMPT (START COPY HERE)

---

You are an expert full-stack engineer. Build the complete, production-ready backend for **GitFlow Studio** — a desktop Git client built with Tauri + React. Every feature listed below must be fully implemented with zero placeholder stubs, zero TODOs, and zero non-functional buttons or UI states. If a UI element exists for a feature, the backend must power it. If a backend feature has no UI yet, build both the UI component and its backend logic.

---

## PROJECT CONTEXT

**GitFlow Studio** is a visual, drag-and-drop, AI-powered Git client desktop app.

- **Shell**: Tauri 2 (Rust) — handles file watching, native dialogs, SQLite, and IPC
- **Frontend**: React 18 + TypeScript + React Flow v11 + Zustand + Tailwind CSS + Framer Motion
- **Git Engine**: `isomorphic-git` (pure JS — NO shell exec, NO native git binary required)
- **AI Providers**: Google Gemini Flash 2.5 (primary, free 500 req/day), Groq Llama 3.3 (secondary, free), Ollama localhost:11434 (fallback, zero cost)
- **Persistence**: SQLite via Tauri plugin (`tauri-plugin-sql`) — stores AI response cache, user preferences, branch folder configs, stash metadata
- **Auth**: GitHub OAuth + GitLab OAuth via Tauri shell for push/pull to hosted remotes
- **Testing**: Vitest (unit) + Playwright (E2E)

---

## PERFORMANCE CONSTRAINTS (NON-NEGOTIABLE)

1. **Never load the full commit history into memory at once.** Use pagination: load 100 commits at a time, fetch more on canvas scroll.
2. **React Flow graph must use virtualization.** Only render commit nodes currently visible in the viewport. Use React Flow's built-in `nodesDraggable` and viewport-aware rendering.
3. **File watcher must debounce at 300ms.** Do not re-render the canvas on every keypress in the editor.
4. **AI calls must be queued.** Max 2 concurrent AI requests. Cache all responses in SQLite keyed by SHA256 of input. Never make duplicate API calls for identical diffs.
5. **Zustand store must be sliced.** Separate slices for: `repoSlice`, `branchSlice`, `commitSlice`, `conflictSlice`, `aiSlice`, `uiSlice`, `stashSlice`. No monolithic store.
6. **SQLite writes must be async and batched.** Never block the UI thread with a DB write.
7. **isomorphic-git operations must run in a Web Worker** (or Tauri async command) to never block the main thread.
8. **Tauri Rust side must use `tokio` async throughout** — no blocking calls on the main thread.

---

## DIRECTORY STRUCTURE TO GENERATE

```
gitflow-studio/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    # Tauri app entry, plugin registration
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── repo.rs                # open_repo, init_repo, clone_repo
│   │   │   ├── git_ops.rs             # All git operations (stage, commit, push, pull, etc.)
│   │   │   ├── file_watcher.rs        # Debounced file system watcher
│   │   │   ├── auth.rs                # GitHub/GitLab OAuth PKCE flow
│   │   │   ├── ai_cache.rs            # SQLite AI response cache
│   │   │   ├── settings.rs            # User preferences CRUD
│   │   │   ├── worktree.rs            # Git worktree management
│   │   │   └── archive.rs             # git archive (zip/tar export)
│   │   └── db/
│   │       ├── mod.rs
│   │       ├── schema.sql             # All table definitions
│   │       └── migrations.rs          # Version-aware migrations
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── store/                         # Zustand slices
│   │   ├── index.ts                   # Combines all slices
│   │   ├── repoSlice.ts
│   │   ├── branchSlice.ts
│   │   ├── commitSlice.ts
│   │   ├── conflictSlice.ts
│   │   ├── aiSlice.ts
│   │   ├── uiSlice.ts
│   │   └── stashSlice.ts
│   │
│   ├── workers/
│   │   └── gitWorker.ts               # Web Worker for isomorphic-git ops
│   │
│   ├── services/
│   │   ├── git/
│   │   │   ├── index.ts               # Unified Git service API
│   │   │   ├── repo.ts                # init, clone, open
│   │   │   ├── staging.ts             # status, add, reset, rm, mv
│   │   │   ├── commits.ts             # commit, amend, log (paginated), show, diff, blame
│   │   │   ├── branches.ts            # branch CRUD, switch, checkout, worktree
│   │   │   ├── merging.ts             # merge, rebase, cherry-pick, mergetool
│   │   │   ├── remotes.ts             # remote CRUD, fetch, pull, push, push --force
│   │   │   ├── stash.ts               # stash, pop, apply, list, drop, clear, branch-from-stash
│   │   │   ├── tags.ts                # tag CRUD, push tags
│   │   │   ├── history.ts             # log, reflog, bisect, shortlog
│   │   │   ├── maintenance.ts         # clean, gc, fsck, archive, submodule, sparse-checkout
│   │   │   └── notes.ts               # git notes CRUD
│   │   │
│   │   ├── ai/
│   │   │   ├── index.ts               # AI router: Gemini → Groq → Ollama fallback chain
│   │   │   ├── gemini.ts              # Gemini Flash 2.5 client
│   │   │   ├── groq.ts                # Groq Llama 3.3 client
│   │   │   ├── ollama.ts              # Ollama local client (auto-detect)
│   │   │   ├── cache.ts               # SHA256-keyed SQLite cache layer
│   │   │   ├── queue.ts               # Request queue, max 2 concurrent
│   │   │   ├── commitMessage.ts       # AI commit message generator
│   │   │   ├── conflictResolver.ts    # AI conflict resolver with confidence %
│   │   │   ├── branchNamer.ts         # AI branch name suggester
│   │   │   ├── prDescription.ts       # AI PR description writer
│   │   │   ├── riskScorer.ts          # AI risk scorer for push/merge
│   │   │   ├── rebasePredictor.ts     # AI rebase conflict predictor
│   │   │   └── explainer.ts           # "What did I break?" natural language explainer
│   │   │
│   │   ├── auth/
│   │   │   ├── github.ts              # GitHub OAuth PKCE + token management
│   │   │   └── gitlab.ts              # GitLab OAuth PKCE + token management
│   │   │
│   │   ├── folders/
│   │   │   ├── autoDetect.ts          # Branch folder auto-grouping algorithm
│   │   │   └── folderStore.ts         # Persist/load folder configs from SQLite
│   │   │
│   │   └── fileWatcher.ts             # Tauri event listener for .git changes
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── GitCanvas.tsx          # Main React Flow canvas
│   │   │   ├── CommitNode.tsx         # Commit node (avatar, hash, message, tags)
│   │   │   ├── BranchLine.tsx         # Colored edge between commits
│   │   │   ├── FolderNode.tsx         # Collapsible branch folder node
│   │   │   ├── ConflictNode.tsx       # Pulsing red conflict indicator
│   │   │   ├── RemoteBadge.tsx        # Gray ghost remote commits
│   │   │   ├── TagBadge.tsx           # Tag pill on commit node
│   │   │   ├── HeadIndicator.tsx      # Pulsing ring on current HEAD
│   │   │   ├── ChunkMode.tsx          # Team zone layout for MNC repos
│   │   │   └── CanvasToolbar.tsx      # Zoom, fit, compact/spacious toggle
│   │   │
│   │   ├── sidebar/
│   │   │   ├── LeftSidebar.tsx        # Branch Explorer + Stash Drawer + File Tree
│   │   │   ├── BranchExplorer.tsx     # Hierarchical branch list with folder groups
│   │   │   ├── FileTree.tsx           # Working directory file tree with M/U/D badges
│   │   │   ├── StashDrawer.tsx        # Stash list with pop/apply/drop/branch actions
│   │   │   └── StagingArea.tsx        # Staged / Unstaged file lists with checkboxes
│   │   │
│   │   ├── panels/
│   │   │   ├── CommitPanel.tsx        # Commit message input + AI suggestion + commit button
│   │   │   ├── CommitDetail.tsx       # Right panel: commit info, diff, notes
│   │   │   ├── DiffViewer.tsx         # Split-pane diff with syntax highlighting
│   │   │   ├── BlameViewer.tsx        # File blame with author + date annotations
│   │   │   ├── ConflictResolver.tsx   # 3-pane conflict card UI (OURS/RESULT/THEIRS)
│   │   │   ├── MergeDialog.tsx        # Merge strategy selector + pre-merge risk score
│   │   │   ├── RebaseEditor.tsx       # Visual interactive rebase (drag to reorder)
│   │   │   ├── BisectWizard.tsx       # git bisect UI: mark good/bad, AI narrows
│   │   │   ├── ReflogPanel.tsx        # Time Machine: all HEAD movements
│   │   │   ├── TeamStats.tsx          # Shortlog: per-author commit breakdown
│   │   │   ├── MaintenancePanel.tsx   # gc, fsck, clean, archive, submodule, sparse
│   │   │   └── SubmodulePanel.tsx     # Submodule list + add/update/remove
│   │   │
│   │   ├── modals/
│   │   │   ├── CommandPalette.tsx     # Cmd+K: search all git actions + branches
│   │   │   ├── CloneDialog.tsx        # URL input + auth + directory picker
│   │   │   ├── RemotesDialog.tsx      # Remotes CRUD + ping status
│   │   │   ├── TagDialog.tsx          # Create lightweight/annotated tag
│   │   │   ├── ConfirmDialog.tsx      # Destructive action confirmation + AI risk warning
│   │   │   ├── ExportArchiveDialog.tsx # git archive: choose format + commit
│   │   │   ├── WorktreePanel.tsx      # Open multiple canvases for worktrees
│   │   │   └── OnboardingFlow.tsx     # First-run setup: API keys, theme, preferences
│   │   │
│   │   ├── ai/
│   │   │   ├── AISidebar.tsx          # "What did I break?" chat sidebar
│   │   │   ├── AIIndicator.tsx        # Bottom bar AI activity spinner + quota counter
│   │   │   └── AIKeySetup.tsx         # API key input in Settings
│   │   │
│   │   └── settings/
│   │       ├── SettingsModal.tsx      # Full settings UI
│   │       ├── ProfileTab.tsx         # git config: name, email, aliases
│   │       ├── RemotesTab.tsx         # Remote repository management
│   │       ├── AITab.tsx              # AI provider config + API keys + daily usage
│   │       ├── AppearanceTab.tsx      # Dark/light mode, density, sound toggle
│   │       └── MaintenanceTab.tsx     # gc, fsck, clean operations
│   │
│   ├── hooks/
│   │   ├── useGitStatus.ts            # Polls .git changes via Tauri event
│   │   ├── useCommitGraph.ts          # Paginated commit graph loader
│   │   ├── useDragMerge.ts            # Drag-to-merge logic for React Flow
│   │   ├── useDragCherryPick.ts       # Drag-to-cherry-pick logic
│   │   ├── useKeyboardShortcuts.ts    # Global keyboard shortcut registry
│   │   ├── useAI.ts                   # AI request with queue + cache
│   │   ├── useConflictResolver.ts     # Conflict state + resolution tracking
│   │   ├── useBisect.ts               # git bisect state machine
│   │   └── useOAuth.ts                # OAuth flow trigger + token retrieval
│   │
│   ├── types/
│   │   ├── git.ts                     # Commit, Branch, Tag, Stash, Remote, Conflict types
│   │   ├── ai.ts                      # AIRequest, AIResponse, AIProvider types
│   │   ├── canvas.ts                  # ReactFlow node/edge custom types
│   │   └── folder.ts                  # BranchFolder, FolderRule types
│   │
│   └── utils/
│       ├── diffParser.ts              # Parse unified diff into structured blocks
│       ├── branchFolderDetect.ts      # Regex rules for branch auto-grouping
│       ├── sha256.ts                  # SHA256 for AI cache keys
│       ├── avatarUrl.ts               # Generate GitHub avatar URLs from email
│       └── rateLimit.ts               # Token bucket for AI quota tracking
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── vitest.config.ts
```

---

## BACKEND IMPLEMENTATION REQUIREMENTS

### 1. TAURI RUST COMMANDS (`src-tauri/src/`)

Implement every command below as a `#[tauri::command]` async function. All heavy I/O must use `tokio`. Return `Result<T, String>` for all commands.

#### `commands/repo.rs`
```rust
// open_repo(path: String) → RepoInfo { path, head_branch, remotes, is_bare }
// init_repo(path: String) → RepoInfo
// clone_repo(url: String, path: String, auth_token: Option<String>) → CloneProgress (streamed via Tauri emit)
// get_git_config(path: String) → GitConfig { name, email, aliases }
// set_git_config(path: String, name: String, email: String) → ()
```

#### `commands/file_watcher.rs`
```rust
// start_watching(path: String, window: Window)
// Debounce: 300ms. Emit "git-changed" event to frontend when .git/index or .git/refs changes.
// stop_watching(path: String)
```

#### `commands/auth.rs`
```rust
// start_github_oauth() → opens browser with PKCE flow, returns code via local callback server on port 7890
// exchange_github_token(code: String, verifier: String) → OAuthToken { access_token, refresh_token, expires_at }
// start_gitlab_oauth() → same pattern
// exchange_gitlab_token(code: String, verifier: String) → OAuthToken
// store_token(provider: String, token: OAuthToken) → () // store in OS keychain via tauri-plugin-store
// get_token(provider: String) → Option<OAuthToken>
// revoke_token(provider: String) → ()
```

#### `commands/ai_cache.rs`
```rust
// get_cached_ai_response(input_hash: String) → Option<String>
// store_ai_response(input_hash: String, response: String, provider: String) → ()
// get_daily_usage(provider: String, date: String) → u32
// increment_usage(provider: String, date: String) → ()
// clear_cache() → ()
```

#### `commands/settings.rs`
```rust
// get_settings() → AppSettings { theme, density, sound_enabled, ai_provider_order, ... }
// save_settings(settings: AppSettings) → ()
// get_branch_folders(repo_path: String) → Vec<BranchFolder>
// save_branch_folders(repo_path: String, folders: Vec<BranchFolder>) → ()
```

#### `db/schema.sql`
```sql
CREATE TABLE IF NOT EXISTS ai_cache (
  input_hash TEXT PRIMARY KEY,
  response TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_usage (
  provider TEXT NOT NULL,
  date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (provider, date)
);

CREATE TABLE IF NOT EXISTS branch_folders (
  repo_path TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  color TEXT,
  position_x REAL,
  position_y REAL,
  collapsed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (repo_path, folder_name)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commit_notes (
  repo_path TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (repo_path, commit_sha)
);
```

---

### 2. GIT SERVICE LAYER (`src/services/git/`)

Use **isomorphic-git** exclusively. All git operations must run inside a **Web Worker** (`src/workers/gitWorker.ts`) to never block the React render thread. The worker communicates via `postMessage` with a `{ id, method, args }` protocol and resolves Promises on the calling side.

#### `repo.ts` — implement:
- `openRepo(path)` → read HEAD, branches, remotes; return `RepoState`
- `initRepo(path)` → `git.init`, return `RepoState`
- `cloneRepo(url, path, token, onProgress)` → `git.clone` with `http.fetch` override for auth; emit progress events

#### `staging.ts` — implement:
- `getStatus(path)` → `git.statusMatrix` → return `{ staged: FileStatus[], unstaged: FileStatus[], untracked: string[] }`
- `stageFile(path, filepath)` → `git.add`
- `stageAll(path)` → `git.add({ filepath: '.' })`
- `unstageFile(path, filepath)` → `git.resetIndex`
- `discardChanges(path, filepath)` → `git.checkout({ filepath })`
- `removeFile(path, filepath)` → `git.remove`
- `moveFile(path, from, to)` → read file, write to new path, `git.add` new, `git.remove` old
- `getDiff(path, filepath, staged)` → `git.diff` → return unified diff string
- `getStagedDiff(path)` → aggregate all staged file diffs

#### `commits.ts` — implement:
- `getLog(path, page, pageSize)` → `git.log({ depth: pageSize, since })` — paginated
- `getCommit(path, sha)` → `git.readCommit` → return `CommitDetail`
- `commit(path, message, author)` → `git.commit`
- `amendCommit(path, message)` → `git.commit({ amend: true })`
- `quickCommit(path, message, author)` → `git.add({ filepath: '.' })` then `git.commit`
- `resetToCommit(path, sha, mode)` → soft/mixed/hard reset via `git.writeRef` + working tree restore for hard
- `getDiffBetweenCommits(path, sha1, sha2)` → compare trees, return per-file diffs

#### `branches.ts` — implement:
- `listBranches(path)` → local + remote branches from `git.listBranches` and `git.listRemotes`
- `createBranch(path, name, startPoint?)` → `git.branch`
- `deleteBranch(path, name)` → `git.deleteBranch`
- `renameBranch(path, oldName, newName)` → create new ref, delete old
- `switchBranch(path, name)` → `git.checkout`
- `createAndSwitch(path, name, startPoint?)` → create + checkout

#### `merging.ts` — implement:
- `merge(path, theirBranch, strategy)` → `git.merge` (merge commit / squash / rebase modes)
- `abortMerge(path)` → restore to pre-merge state, clear MERGE_HEAD
- `cherryPick(path, sha)` → apply commit patch onto current HEAD
- `rebase(path, onto)` → sequential cherry-pick of commits
- `interactiveRebase(path, onto, plan)` → execute rebase plan `{ sha, action: 'pick'|'squash'|'drop'|'edit' }[]`
- `getConflicts(path)` → scan `git.statusMatrix` for conflict states → return `ConflictFile[]`
- `resolveConflict(path, filepath, resolution)` → write resolved content, `git.add`
- `completeConflictResolution(path)` → commit merge after all conflicts resolved

#### `remotes.ts` — implement:
- `listRemotes(path)` → `git.listRemotes`
- `addRemote(path, name, url)` → `git.addRemote`
- `removeRemote(path, name)` → `git.deleteRemote`
- `fetch(path, remote, token?)` → `git.fetch`
- `pull(path, remote, branch, token?)` → `git.pull`
- `push(path, remote, branch, token?, force?)` → `git.push` — for force: show AI risk warning first
- `pingRemote(url, token?)` → HEAD request to check connectivity
- `pushTags(path, remote, token?)` → push all tags

#### `stash.ts` — implement:
Since `isomorphic-git` lacks native stash, implement manually:
- `stash(path, message?)` → 1) read working tree changes, 2) save as a stash object in SQLite (`stash_entries` table with diff + metadata), 3) restore to last commit HEAD
- `stashPop(path, stashId)` → apply stash then delete
- `stashApply(path, stashId)` → apply stash diff to working tree without deleting
- `stashList(path)` → load from SQLite
- `stashDrop(path, stashId)` → delete from SQLite
- `stashClear(path)` → delete all for repo
- `stashBranch(path, stashId, branchName)` → createBranch at stash point, apply stash

#### `tags.ts` — implement:
- `listTags(path)` → `git.listTags`
- `createTag(path, name, sha, message?)` → lightweight or annotated via `git.tag`
- `deleteTag(path, name)` → `git.deleteTag`

#### `history.ts` — implement:
- `getReflog(path)` → read `.git/logs/HEAD` line by line → return `ReflogEntry[]`
- `bisectStart(path, goodSha, badSha)` → binary search state: compute midpoint SHA
- `bisectMark(path, sha, isGood)` → narrow range, return next SHA to test or result
- `getShortlog(path)` → aggregate `git.log`, group by author → return `AuthorStats[]`

#### `maintenance.ts` — implement:
- `cleanUntracked(path, dryRun)` → compare working tree to index, return/remove untracked files
- `optimizeRepo(path)` → call Tauri `git_gc` command (invokes `git gc` if git binary present, else pack loose objects via isomorphic-git)
- `checkIntegrity(path)` → verify object SHA checksums via isomorphic-git object store
- `exportArchive(path, sha, format, outputPath)` → read git tree at sha, write zip/tar via `tauri::api::file`
- `listSubmodules(path)` → parse `.gitmodules`
- `initSubmodule(path, submodulePath)` → clone submodule
- `updateSubmodules(path)` → pull each submodule to pinned SHA
- `setSparseCheckout(path, patterns)` → write `.git/info/sparse-checkout`, set `core.sparseCheckout = true`

#### `notes.ts` — implement using SQLite (isomorphic-git does not support `git notes`):
- `addNote(repoPath, sha, text)` → insert into `commit_notes`
- `getNote(repoPath, sha)` → select from `commit_notes`
- `deleteNote(repoPath, sha)` → delete from `commit_notes`

---

### 3. AI SERVICE LAYER (`src/services/ai/`)

#### `index.ts` — AI Router
```typescript
// Provider priority chain: Gemini → Groq → Ollama
// Before every request:
//   1. Check SHA256 cache in SQLite → return cached if hit
//   2. Check daily quota for primary provider
//   3. If quota exceeded, fallback to next provider
//   4. Queue request (max 2 concurrent via queue.ts)
//   5. Store response in cache + increment usage counter
export async function aiRequest(input: string, task: AITask): Promise<AIResponse>
```

#### `gemini.ts`
```typescript
// Model: gemini-2.5-flash-latest
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
// Pass API key from settings (never hardcoded)
// Handle 429 → throw QuotaExceeded to trigger fallback
```

#### `groq.ts`
```typescript
// Model: llama-3.3-70b-versatile
// Endpoint: https://api.groq.com/openai/v1/chat/completions
// Pass API key from settings
// Handle 429 → throw QuotaExceeded to trigger fallback
```

#### `ollama.ts`
```typescript
// Auto-detect: fetch http://localhost:11434/api/tags on app start
// If available: set as valid provider
// Model: prefer gemma2 or phi4 if available, else first available model
// Stream response via fetch with ReadableStream
```

#### `commitMessage.ts`
```typescript
// Input: staged diff (string), repo context (recent 5 commit messages)
// Output: { subject: string, body?: string, confidence: number }
// Prompt: "Analyze this diff and write a git commit message following Conventional Commits spec.
//          Subject line max 72 chars. Be specific about what changed and why.
//          Diff:\n{diff}\n\nRecent commits for context:\n{recentCommits}"
```

#### `conflictResolver.ts`
```typescript
// Input: { ours: string, theirs: string, base: string, filename: string }
// Output: { resolution: string, confidence: number, reasoning: string, winner: 'ours' | 'theirs' | 'mixed' }
// Prompt: "You are resolving a git merge conflict in {filename}.
//          OURS:\n{ours}\n\nTHEIRS:\n{theirs}\n\nBASE:\n{base}\n
//          Provide the best merged result. Explain your reasoning. Output JSON only:
//          { resolution, confidence (0-100), reasoning, winner }"
```

#### `branchNamer.ts`
```typescript
// Input: description or ticket ID string
// Output: { name: string, alternatives: string[] }
// Prompt: "Generate a git branch name for: '{description}'.
//          Follow: type/short-description. Types: feature, bugfix, hotfix, chore, refactor.
//          Output JSON: { name, alternatives: [2 other options] }"
```

#### `prDescription.ts`
```typescript
// Input: commits[] (messages + diffs), base branch, head branch
// Output: { title: string, body: string }
// Prompt: "Write a GitHub PR description for merging '{head}' into '{base}'.
//          Changes:\n{commitSummary}\n
//          Output JSON: { title, body (markdown with ## Summary, ## Changes, ## Testing) }"
```

#### `riskScorer.ts`
```typescript
// Input: operation ('push' | 'merge' | 'force-push' | 'rebase'), affected files, branch names
// Output: { score: number (0-100), risks: string[], recommendation: string }
// Prompt: "Rate the risk (0-100) of this git operation: {operation}
//          Affected files: {files}. Branches: {branches}.
//          Output JSON: { score, risks: [], recommendation }"
```

#### `rebasePredictor.ts`
```typescript
// Input: commits to rebase[], onto branch recent commits[]
// Output: { conflicts: PredictedConflict[], confidence: number }
```

#### `explainer.ts`
```typescript
// Input: question (natural language), recent git log, recent diff
// Output: { answer: string, suggestedCommands?: string[] }
// Powers the "What did I break?" AI sidebar chat
```

---

### 4. BRANCH FOLDER AUTO-DETECTION (`src/services/folders/autoDetect.ts`)

```typescript
// Apply rules IN ORDER — first match wins:
const RULES = [
  { pattern: /^@(.+?)\//, folder: 'By Owner', extract: (m) => m[1] },
  { pattern: /^([A-Z]+-\d+)\//, folder: 'By Ticket', extract: (m) => m[1] },
  { pattern: /^(feature|feat)\//, folder: 'Features' },
  { pattern: /^(bugfix|fix|bug)\//, folder: 'Bug Fixes' },
  { pattern: /^(hotfix)\//, folder: 'Hotfixes' },
  { pattern: /^(release)\//, folder: 'Releases' },
  { pattern: /^(chore|refactor|docs|test|ci)\//, folder: 'Maintenance' },
  { pattern: /^team-(.+?)\//, folder: 'By Team', extract: (m) => m[1] },
  { pattern: /^service-(.+?)\//, folder: 'By Service', extract: (m) => m[1] },
  { pattern: /^(.+?)\//, folder: 'Other', extract: (m) => m[1] },
];

export function groupBranches(branches: string[]): BranchFolder[]
// Returns: folders with { name, branches[], collapsed, healthScore, conflictCount, staleCount }
// A branch is "stale" if its last commit is >30 days ago
// healthScore: (active_branches / total_branches) * 100
```

---

### 5. ZUSTAND STORE SLICES (`src/store/`)

Each slice must be a separate file using `immer` for immutable updates.

#### `repoSlice.ts`
```typescript
interface RepoSlice {
  currentRepo: RepoState | null;
  recentRepos: string[];
  openRepo: (path: string) => Promise<void>;
  closeRepo: () => void;
}
```

#### `commitSlice.ts`
```typescript
interface CommitSlice {
  commits: Commit[];
  totalLoaded: number;
  isLoading: boolean;
  hasMore: boolean;
  loadInitialCommits: () => Promise<void>;
  loadMoreCommits: () => Promise<void>;  // called on canvas scroll
  refreshCommits: () => Promise<void>;
}
```

#### `branchSlice.ts`
```typescript
interface BranchSlice {
  branches: Branch[];
  currentBranch: string;
  folders: BranchFolder[];
  switchBranch: (name: string) => Promise<void>;
  createBranch: (name: string, startPoint?: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  renameBranch: (old: string, newName: string) => Promise<void>;
  refreshBranches: () => Promise<void>;
  toggleFolder: (name: string) => void;
}
```

#### `conflictSlice.ts`
```typescript
interface ConflictSlice {
  conflicts: ConflictFile[];
  resolutions: Record<string, ConflictResolution>;
  aiSuggestions: Record<string, AIConflictSuggestion>;
  resolveConflict: (filepath: string, resolution: string) => Promise<void>;
  acceptAISuggestion: (filepath: string) => Promise<void>;
  completeMerge: () => Promise<void>;
}
```

#### `aiSlice.ts`
```typescript
interface AISlice {
  isGenerating: boolean;
  dailyUsage: Record<string, number>;  // provider → count
  lastError: string | null;
  queueLength: number;
  generateCommitMessage: (diff: string) => Promise<string>;
  resolveConflict: (conflict: ConflictInput) => Promise<AIConflictSuggestion>;
  scoreRisk: (op: string, files: string[]) => Promise<RiskScore>;
  askExplainer: (question: string) => Promise<string>;
}
```

---

### 6. REACT FLOW CANVAS (`src/components/canvas/`)

#### `GitCanvas.tsx`
```typescript
// - Use ReactFlow with custom node types: commitNode, branchFolderNode, conflictNode
// - Enable: nodesDraggable (for cherry-pick source), connectOnClick (for merge target detection)
// - Viewport virtualization: only render nodes within viewport bounds + 200px buffer
// - On drag of a branch label node onto another branch label node: trigger useDragMerge
// - On drag of a commit node onto a branch label node: trigger useDragCherryPick
// - Infinite canvas: minimap in bottom-right corner
// - Keyboard: Space = pan, Scroll = zoom, Cmd+F = fit view
// - Canvas background: dot grid pattern matching #0F172A theme
// - Auto-layout algorithm: topological sort of commits → assign x/y positions by date column
```

#### `CommitNode.tsx`
```typescript
// Props: sha, message, author, timestamp, tags[], isHead, isRemote, hasConflict
// Visual:
//   - Circle (40px) with author GitHub avatar
//   - If isHead: pulsing ring animation (CSS keyframes)
//   - If hasConflict: pulsing red border
//   - If isRemote: 60% opacity
//   - Below circle: 7-char SHA in JetBrains Mono, message preview (40 chars)
//   - Tag badges as pills above the node
// On click: dispatch to commitSlice to open CommitDetail right panel
// On right-click: context menu with all applicable git actions
```

---

### 7. COMMAND PALETTE (`src/components/modals/CommandPalette.tsx`)

```typescript
// Trigger: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
// Search through:
//   - All git actions (static list of ~40 commands with keyboard shortcuts)
//   - Branch names (live from branchSlice)
//   - Recent commits (SHA + message)
//   - Settings sections
// Fuzzy search using fuse.js
// Each result shows: icon, label, keyboard shortcut, and executes action on Enter
// Commands include: commit, stage all, push, pull, fetch, create branch, merge, rebase,
//   stash, pop stash, switch branch (all branches listed), open settings, toggle chunk mode,
//   open reflog, open team stats, run integrity check, export archive, etc.
```

---

### 8. CONFLICT RESOLVER UI (`src/components/panels/ConflictResolver.tsx`)

```typescript
// 3-column layout: OURS | RESULT (editable) | THEIRS
// Each conflict hunk is a collapsible Card component
// Card header: filename, line range, conflict index
// Card body:
//   - Left column: syntax-highlighted "ours" version (read-only)
//   - Center column: Monaco editor (or CodeMirror 6 for lighter weight) — user edits resolution
//   - Right column: syntax-highlighted "theirs" version (read-only)
// Below each card: "Accept Ours" | "Accept Theirs" | "AI Suggestion" buttons
// AI Suggestion: shows reasoning + confidence % badge
// Bottom bar: "Accept All AI Suggestions" + "Complete Merge" (disabled until all resolved)
// Progress indicator: "3 of 7 conflicts resolved"
```

---

### 9. INTERACTIVE REBASE EDITOR (`src/components/panels/RebaseEditor.tsx`)

```typescript
// Visual list of commits to rebase (in order)
// Each commit row: drag handle | action dropdown (pick/squash/fixup/drop/edit/reword) | SHA | message
// Drag to reorder: use @dnd-kit/sortable for drag-and-drop list
// Action dropdown colors: pick=blue, squash=purple, drop=red, edit=amber
// "Start Rebase" button executes the plan via merging.ts interactiveRebase()
// Progress view: shows current commit being applied, conflicts if any
```

---

### 10. OAUTH FLOW (`src/services/auth/github.ts`)

```typescript
// PKCE OAuth flow (no client secret needed):
// 1. Generate code_verifier (random 64 bytes base64url)
// 2. Generate code_challenge = base64url(sha256(code_verifier))
// 3. Open browser: https://github.com/login/oauth/authorize?client_id=...&code_challenge=...
// 4. Start local HTTP server on port 7890 (via Tauri) to catch redirect
// 5. Exchange code + verifier for token via GitHub API
// 6. Store token in OS keychain via tauri-plugin-store
// 7. Use token in Authorization header for all push/pull/fetch operations
// GitHub App client_id: must be configurable in settings (user provides their own GitHub App)
```

---

### 11. KEYBOARD SHORTCUTS (`src/hooks/useKeyboardShortcuts.ts`)

Register these globally:
```
Cmd+K          → Open Command Palette
Cmd+Enter      → Commit (when staging panel focused)
Cmd+Shift+P    → Push
Cmd+Shift+L    → Pull
Cmd+Shift+F    → Fetch
Cmd+Shift+S    → Stash
Cmd+Z          → Undo last git action (where reversible)
Cmd+Shift+Z    → Redo
Cmd+B          → Toggle left sidebar
Cmd+J          → Toggle bottom commit panel
Cmd+\          → Toggle right detail panel
Cmd+F          → Fit canvas to view
Escape         → Close any open modal/panel
Cmd+,          → Open Settings
Cmd+Shift+K    → Delete branch (with confirmation)
Cmd+Shift+M    → Open Merge Dialog
Cmd+Shift+R    → Open Rebase Dialog
```

---

### 12. FILE WATCHER INTEGRATION

```typescript
// src/services/fileWatcher.ts
// Listen to Tauri event "git-changed" (emitted by Rust debounced watcher)
// On event:
//   1. Call gitService.getStatus() → update uiSlice.fileStatuses
//   2. If .git/refs changed: call commitSlice.refreshCommits() + branchSlice.refreshBranches()
//   3. If .git/MERGE_HEAD exists: set conflictSlice to conflict state
//   4. Update bottom bar sync status indicator
```

---

### 13. ERROR HANDLING STANDARDS

Every async operation must:
1. Wrap in try/catch
2. Dispatch to `uiSlice.setError(message)` for user-visible toast notifications
3. Log to Tauri logger (`tauri-plugin-log`) at appropriate level
4. Never crash the app — all errors are recoverable

Destructive operations (delete branch, force push, hard reset, clean, gc) must:
1. Show `ConfirmDialog` with the exact command that will run
2. Call `riskScorer.ts` and display AI risk score in the dialog
3. Require explicit user confirmation text input for force-push (type "FORCE PUSH" to confirm)

---

### 14. PERFORMANCE OPTIMIZATIONS

```typescript
// CommitGraph rendering:
// - Use React.memo on CommitNode, BranchLine
// - Only recalculate layout when commits array changes (useMemo)
// - Virtualize: filter nodes to viewport ± 200px before passing to ReactFlow

// AI calls:
// - Debounce commit message generation: 500ms after last staged file change
// - Never call AI for empty diffs
// - Return cached response immediately if SHA256 cache hit

// Zustand:
// - Use shallow equality selector for all component subscriptions
// - Never subscribe to entire store — always use sliced selectors

// isomorphic-git in Worker:
// - Keep the worker alive between operations (don't terminate after each call)
// - Use LightningFS for the in-memory filesystem layer (isomorphic-git default)
// - Limit git.log depth to 100 per page; use `since` cursor for pagination
```

---

### 15. TESTING REQUIREMENTS

#### `vitest` unit tests for:
- `branchFolderDetect.ts` — test all 10 folder pattern rules
- `aiCache.ts` — test cache hit/miss/expiry
- `diffParser.ts` — test unified diff parsing
- `rateLimit.ts` — test token bucket logic
- All git service functions with a mock isomorphic-git and mock LightningFS

#### `playwright` E2E tests for:
- Open a repo → verify commit graph renders
- Stage a file → commit → verify new node on canvas
- Create branch → verify in branch explorer
- Cmd+K → search "push" → execute → verify push dialog

---

### 16. `package.json` DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "reactflow": "^11.11.0",
    "zustand": "^4.5.0",
    "immer": "^10.0.0",
    "framer-motion": "^11.0.0",
    "isomorphic-git": "^1.25.0",
    "@isomorphic-git/lightning-fs": "^4.6.0",
    "fuse.js": "^7.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@codemirror/view": "^6.26.0",
    "@codemirror/state": "^6.4.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0",
    "@tauri-apps/plugin-log": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-http": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.4.0",
    "@playwright/test": "^1.43.0",
    "@testing-library/react": "^15.0.0"
  }
}
```

---

### 17. `Cargo.toml` DEPENDENCIES

```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
tauri-plugin-log = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-http = "2"
tauri-plugin-shell = "2"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
notify = "6"          # File system watching
sha2 = "0.10"         # SHA256 for cache keys
base64 = "0.22"
uuid = { version = "1", features = ["v4"] }
anyhow = "1"
```

---

### 18. STARTUP SEQUENCE

```typescript
// App.tsx onMount:
1. Load app settings from SQLite
2. Check Ollama availability (fetch localhost:11434) → update aiSlice.ollamaAvailable
3. Check for last opened repo → auto-open if found
4. Start file watcher for current repo
5. Load branch folders from SQLite for current repo
6. Load initial 100 commits → render canvas
7. Run stale branch detection (background, no UI block)
8. Show OnboardingFlow if first run (no API keys configured)
```

---

### 19. UI MISSING FROM PRD — BUILD THESE

The PRD describes these features but provides no UI spec. Build complete UI + backend for each:

1. **Bisect Wizard** — step-by-step UI: "Mark current commit as Good / Bad", progress bar showing remaining candidates, AI suggestion for next test step, result display when bug commit found
2. **Reflog Panel (Time Machine)** — full-width table: timestamp | operation | SHA | message; click any row to checkout that state; search/filter bar
3. **Team Stats (Shortlog)** — bar chart (recharts) of commits per author last 30/60/90 days; author avatar + name + commit count cards
4. **Maintenance Panel** — card layout: Optimize (gc), Check Integrity (fsck), Clean Untracked (with file preview list), each with status indicator (last run time + result)
5. **Submodule Panel** — list of submodules: name, path, current SHA, upstream SHA; Add / Update / Remove buttons
6. **Sparse Checkout Panel** — text area for path patterns, "Apply" button, current patterns displayed as tags
7. **Worktree Panel** — list of open worktrees with path + branch; "Open New Canvas" button; "Remove Worktree" per entry
8. **Chunk Mode** — canvas overlay that draws colored zone rectangles around branch folder groups; toggle via toolbar button; zones are labeled and draggable

---

### FINAL CHECKLIST

Before considering the implementation complete, verify:

- [ ] Every button in the UI triggers a real backend operation (no console.log stubs)
- [ ] Every isomorphic-git call runs in the Web Worker
- [ ] All AI calls are cached and queued
- [ ] File watcher is debounced at 300ms
- [ ] Commit graph loads 100 at a time, loads more on scroll
- [ ] All destructive actions show confirmation dialog with AI risk score
- [ ] OAuth tokens stored in OS keychain (not localStorage)
- [ ] SQLite schema migrations run on startup
- [ ] App starts in <2 seconds on a repo with 1000+ commits
- [ ] All 8 missing UI panels from Section 19 are built and functional
- [ ] Command palette includes all 40+ git actions
- [ ] Keyboard shortcuts registered globally

---

*End of master prompt. Generate the full implementation file by file.*
