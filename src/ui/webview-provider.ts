import * as vscode from 'vscode';
import * as path from 'path';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { AutoCapture } from '../capture/auto-capture';
import { Logger } from '../utils/logger';

export class ContextWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase,
        private readonly configStore: ConfigStore,
        private readonly autoCapture: AutoCapture
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'getContexts':
                    const contexts = await this.database.getContexts();
                    webviewView.webview.postMessage({
                        type: 'contextsData',
                        contexts: contexts.slice(0, 10) // Latest 10
                    });
                    break;
                case 'addTestContext':
                    await this.autoCapture.captureManualContext(
                        'conversation',
                        'Test context entry created from panel',
                        5,
                        ['test', 'manual']
                    );
                    break;
                case 'getConfig':
                    const config = this.configStore.getConfig();
                    const status = this.autoCapture.getStatus();
                    webviewView.webview.postMessage({
                        type: 'configData',
                        config,
                        status
                    });
                    break;
                case 'toggleGitCapture':
                    await this.autoCapture.toggleGitMonitoring();
                    vscode.window.showInformationMessage('Git capture toggled');
                    break;
                case 'toggleFileCapture':
                    await this.autoCapture.toggleFileMonitoring();
                    vscode.window.showInformationMessage('File monitoring toggled');
                    break;
            }
        });

        Logger.info('Webview provider initialized');
    }

    private getHtmlForWebview(_webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Claude Context</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 16px;
                    margin: 0;
                }
                .status-card {
                    background: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .context-list {
                    max-height: 300px;
                    overflow-y: auto;
                }
                .context-item {
                    padding: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .context-type {
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                .context-timestamp {
                    font-size: 0.8em;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="status-card">
                <h3>🏠 General Status</h3>
                <p>Project: <span id="project-name">Loading...</span></p>
                <p>Contexts: <span id="context-count">0</span></p>
                <button class="btn" onclick="loadContexts()">Refresh</button>
                <button class="btn" onclick="addTestContext()">Add Test Context</button>
            </div>

            <div class="status-card">
                <h3>⚙️ Auto-Capture Settings</h3>
                <div style="margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="git-commits" style="margin-right: 8px;">
                        📝 Capture Git Commits
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="file-changes" style="margin-right: 8px;">
                        📁 Monitor File Changes
                    </label>
                </div>
                <div id="capture-status" style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">
                    Status: Loading...
                </div>
            </div>

            <div class="status-card">
                <h3>📝 Recent Contexts</h3>
                <div id="context-list" class="context-list">
                    <p>Loading contexts...</p>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function loadContexts() {
                    vscode.postMessage({ type: 'getContexts' });
                }

                function addTestContext() {
                    vscode.postMessage({ type: 'addTestContext' });
                    setTimeout(loadContexts, 500);
                }

                function loadConfig() {
                    vscode.postMessage({ type: 'getConfig' });
                }

                function toggleGitCapture() {
                    vscode.postMessage({ type: 'toggleGitCapture' });
                    setTimeout(loadConfig, 300);
                }

                function toggleFileCapture() {
                    vscode.postMessage({ type: 'toggleFileCapture' });
                    setTimeout(loadConfig, 300);
                }

                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'contextsData':
                            displayContexts(message.contexts);
                            break;
                        case 'configData':
                            updateConfigUI(message.config, message.status);
                            break;
                    }
                });

                function displayContexts(contexts) {
                    document.getElementById('context-count').textContent = contexts.length;
                    
                    const listEl = document.getElementById('context-list');
                    if (contexts.length === 0) {
                        listEl.innerHTML = '<p>No contexts yet</p>';
                        return;
                    }

                    listEl.innerHTML = contexts.map(ctx => 
                        \`<div class="context-item">
                            <span class="context-type">\${ctx.type.toUpperCase()}</span>
                            <br><span class="context-timestamp">\${new Date(ctx.timestamp).toLocaleString()}</span>
                            <br>\${ctx.content.substring(0, 100)}...
                        </div>\`
                    ).join('');
                }

                function updateConfigUI(config, status) {
                    // Update checkboxes
                    document.getElementById('git-commits').checked = config.capture.gitCommits;
                    document.getElementById('file-changes').checked = config.capture.fileChanges;
                    
                    // Update status display
                    const statusText = \`Git: \${status.gitMonitoring ? '✅' : '❌'} | Files: \${status.fileMonitoring ? '✅' : '❌'} | Workspace: \${status.workspaceActive ? '✅' : '❌'}\`;
                    document.getElementById('capture-status').textContent = statusText;
                }

                // Add event listeners
                document.getElementById('git-commits').addEventListener('change', toggleGitCapture);
                document.getElementById('file-changes').addEventListener('change', toggleFileCapture);

                // Set project name
                document.getElementById('project-name').textContent = 
                    'Context Manager AI';

                // Initial load
                loadContexts();
                loadConfig();
            </script>
        </body>
        </html>`;
    }
}