import * as vscode from "vscode";
import * as path from "path";
import type { WebviewToHost } from "./messages";
import type { HostToWebview } from "./messages";
import { handleWebviewMessage } from "./webviewHandler";

export function activate(context: vscode.ExtensionContext) {
  const provider = new GitFlowWebviewViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GitFlowWebviewViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("gitflow-studio.refresh", () =>
      provider.postRefresh()
    ),
    vscode.commands.registerCommand("gitflow-studio.open", () =>
      vscode.commands.executeCommand("gitflow-studio.canvas.focus")
    ),
    vscode.commands.registerCommand("gitflow-studio.commandPalette", () =>
      provider.postOpenCommandPalette()
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("gitflow-studio")) {
        provider.postConfig();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      provider.postRefresh();
    })
  );

  let editorRefreshTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (editorRefreshTimer !== undefined) {
        clearTimeout(editorRefreshTimer);
      }
      editorRefreshTimer = setTimeout(() => {
        editorRefreshTimer = undefined;
        provider.postRefresh();
      }, 400);
    })
  );
}

export function deactivate() {}

class GitFlowWebviewViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "gitflow-studio.canvas";

  private view?: vscode.WebviewView;
  private cspNonce = getNonce();

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;
    this.cspNonce = getNonce();
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "media", "webview"),
      ],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg: WebviewToHost) =>
      this.onMessage(webviewView.webview, msg)
    );
    this.postConfig();
  }

  postRefresh() {
    void this.view?.webview.postMessage({ type: "hostRefresh" } as const);
  }

  postOpenCommandPalette() {
    void vscode.commands.executeCommand("gitflow-studio.canvas.focus");
    void this.view?.webview.postMessage({
      type: "openCommandPalette",
    } satisfies HostToWebview);
  }

  postConfig() {
    const cfg = vscode.workspace.getConfiguration("gitflow-studio");
    void this.view?.webview.postMessage({
      type: "config",
      geminiConfigured: Boolean(cfg.get<string>("geminiApiKey")?.trim()),
      groqConfigured: Boolean(cfg.get<string>("groqApiKey")?.trim()),
    } satisfies HostToWebview);
  }

  private getWorkspaceRoot(): string | null {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
  }

  /**
   * Resolves the Git repo root: collects roots from every workspace folder,
   * then picks the best match (repo containing the active file, else deepest
   * path) so we don’t lock onto a parent/empty repo when another folder has
   * the real history.
   */
  private getGitRoot(): string | null {
    const candidates: string[] = [];
    const seen = new Set<string>();
    
    // First, check workspace folders
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const root = getGitRootSync(folder.uri.fsPath);
      if (!root) continue;
      const key =
        process.platform === "win32" ? root.toLowerCase() : path.normalize(root);
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(root);
    }
    
    // FALLBACK: If no workspace folders, try the workspace root directly
    if (candidates.length === 0) {
      const wsRoot = this.getWorkspaceRoot();
      if (wsRoot) {
        const root = getGitRootSync(wsRoot);
        if (root) {
          candidates.push(root);
        }
      }
    }
    
    // FALLBACK: Try active editor path
    const active = vscode.window.activeTextEditor?.document.uri;
    const activePath = active?.scheme === "file" ? active.fsPath : null;
    
    if (candidates.length > 0) {
      const result = pickBestGitRoot(candidates, activePath);
      return result;
    }

    if (activePath) {
      const result = getGitRootSync(path.dirname(activePath));
      return result;
    }

    return null;
  }

  private async onMessage(webview: vscode.Webview, msg: WebviewToHost) {
    const ctx = {
      webview,
      workspaceRoot: this.getWorkspaceRoot(),
      getGitRoot: () => this.getGitRoot(),
      maxCommits: () =>
        vscode.workspace
          .getConfiguration("gitflow-studio")
          .get<number>("maxCommits") ?? 180,
      postConfig: () => this.postConfig(),
    };
    await handleWebviewMessage(ctx, msg);
  }

  private getHtml(webview: vscode.Webview): string {
    const base = vscode.Uri.joinPath(this.extensionUri, "media", "webview");
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(base, "assets", "index.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(base, "assets", "index.css"));
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `script-src 'nonce-${this.cspNonce}'`,
      `font-src ${webview.cspSource} https://fonts.gstatic.com data:`,
      `img-src ${webview.cspSource} data: https:`,
      `connect-src https://generativelanguage.googleapis.com https://api.groq.com`,
    ].join("; ");

    const fontCss =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${fontCss}" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>GitFlow Studio</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${this.cspNonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let i = 0; i < 32; i++) {
    t += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return t;
}

function getGitRootSync(workspaceRoot: string): string | null {
  try {
    const cp = require("child_process") as typeof import("child_process");
    const out = cp
      .execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: workspaceRoot,
        windowsHide: true,
      })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

function fileUnderGitRoot(filePath: string, root: string): boolean {
  const f = path.normalize(filePath);
  const r = path.normalize(root);
  const sep = path.sep;
  if (process.platform === "win32") {
    const fl = f.toLowerCase();
    const rl = r.toLowerCase();
    return fl === rl || fl.startsWith(rl + sep);
  }
  return f === r || f.startsWith(r + sep);
}

/** When multiple workspace folders map to different repos, prefer the one that contains the active file; otherwise the longest path (nested repo). */
function pickBestGitRoot(candidates: string[], activeFilePath: string | null): string {
  if (candidates.length === 1) {
    return candidates[0];
  }
  if (activeFilePath) {
    const matching = candidates.filter((r) => fileUnderGitRoot(activeFilePath, r));
    if (matching.length === 1) {
      return matching[0];
    }
    if (matching.length > 1) {
      return matching.sort((a, b) => b.length - a.length)[0];
    }
  }
  return candidates.sort((a, b) => b.length - a.length)[0];
}
