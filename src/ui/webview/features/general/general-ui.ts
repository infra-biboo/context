import { VSCodeBridge } from '../../core/vscode-bridge';

export class GeneralUI {
    private bridge: VSCodeBridge;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
    }

    public getHTML(): string {
        return `
            <div class="status-card">
                <h3>Project Status</h3>
                <p>Contexts: <span id="context-count">0</span></p>
                <button id="refresh-contexts-btn" class="btn">Refresh</button>
                <button id="add-test-context-btn" class="btn btn-secondary">Add Test</button>
            </div>
            <div class="status-card">
                <h3>Auto-Capture Settings</h3>
                <label><input type="checkbox" id="git-commits-checkbox"> Capture Git Commits</label>
                <label><input type="checkbox" id="file-changes-checkbox"> Monitor File Changes</label>
                <div id="capture-status">Status: Loading...</div>
            </div>
            <div class="status-card">
                <h3>MCP Integration</h3>
                <p>Status: <span id="mcp-status" style="font-weight: 600;">Disconnected</span></p>
                <p>Claude Code: <span id="claude-code-status">Not configured</span></p>
                <button id="generate-mcp-config-btn" class="btn">Generate Config</button>
                <button id="test-mcp-connection-btn" class="btn btn-secondary">Test Connection</button>
                <div id="mcp-info" style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
                    Configure MCP to connect with Claude Code
                </div>
            </div>
            <div class="status-card">
                <h3>Recent Contexts</h3>
                <div id="context-list">Loading...</div>
            </div>
        `;
    }

    public setupEventListeners() {
        document.getElementById('refresh-contexts-btn')?.addEventListener('click', () => {
            this.bridge.getContexts();
        });
        document.getElementById('add-test-context-btn')?.addEventListener('click', () => {
            this.bridge.addTestContext();
        });
        document.getElementById('git-commits-checkbox')?.addEventListener('change', () => {
            this.bridge.toggleGitCapture();
        });
        document.getElementById('file-changes-checkbox')?.addEventListener('change', () => {
            this.bridge.toggleFileCapture();
        });
        document.getElementById('generate-mcp-config-btn')?.addEventListener('click', () => {
            this.bridge.generateMCPConfig();
        });
        document.getElementById('test-mcp-connection-btn')?.addEventListener('click', () => {
            this.bridge.testMCPConnection();
        });
    }

    public displayContexts(contexts: any[]) {
        const countEl = document.getElementById('context-count');
        if (countEl) countEl.textContent = contexts.length.toString();

        const listEl = document.getElementById('context-list');
        if (listEl) {
            if (contexts.length === 0) {
                listEl.innerHTML = '<p>No contexts yet.</p>';
                return;
            }
            listEl.innerHTML = contexts.map(ctx => `
                <div class="context-item">
                    <strong>${ctx.type.toUpperCase()}</strong>
                    <div>${new Date(ctx.timestamp).toLocaleString()}</div>
                    <div>${ctx.content.substring(0, 100)}...</div>
                </div>
            `).join('');
        }
    }

    public updateConfigUI(config: any, status: any) {
        const gitCheckbox = document.getElementById('git-commits-checkbox') as HTMLInputElement;
        if (gitCheckbox) gitCheckbox.checked = config.capture.gitCommits;

        const fileCheckbox = document.getElementById('file-changes-checkbox') as HTMLInputElement;
        if (fileCheckbox) fileCheckbox.checked = config.capture.fileChanges;

        const statusEl = document.getElementById('capture-status');
        if (statusEl) {
            statusEl.textContent = `Git: ${status.gitMonitoring ? '✅' : '❌'} | Files: ${status.fileMonitoring ? '✅' : '❌'}`;
        }
    }

    public updateMCPStatus(connected: boolean) {
        const statusEl = document.getElementById('mcp-status');
        const infoEl = document.getElementById('mcp-info');
        const claudeCodeStatusEl = document.getElementById('claude-code-status');
        
        if (statusEl) {
            statusEl.textContent = connected ? 'Connected' : 'Disconnected';
            statusEl.style.color = connected ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-red)';
        }
        
        if (infoEl) {
            infoEl.textContent = connected 
                ? 'MCP server is running and ready'
                : 'Generate config to connect with Claude Code';
        }
        
        if (claudeCodeStatusEl) {
            claudeCodeStatusEl.textContent = connected ? 'Ready' : 'Not configured';
        }
    }
}
