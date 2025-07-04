import * as vscode from 'vscode';
import * as path from 'path';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { AutoCapture } from '../capture/auto-capture';
import { AgentManager } from '../agents/agent-manager';
import { MCPServer } from '../mcp/server';
import { MCPConfigGenerator } from '../mcp/config-generator';
import { Logger } from '../utils/logger';

export class ContextWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase,
        private readonly configStore: ConfigStore,
        private readonly autoCapture: AutoCapture,
        private readonly agentManager: AgentManager,
        private readonly mcpServer: MCPServer,
        private readonly mcpConfigGenerator: MCPConfigGenerator
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
                case 'getAgents':
                    const agents = this.agentManager.getAllAgents();
                    const agentStatus = this.agentManager.getAgentStatus();
                    webviewView.webview.postMessage({
                        type: 'agentsData',
                        agents,
                        status: agentStatus
                    });
                    break;
                case 'toggleAgent':
                    const { agentId, enabled } = data;
                    await this.agentManager.toggleAgent(agentId);
                    vscode.window.showInformationMessage(`Agent ${agentId} ${enabled ? 'enabled' : 'disabled'}`);
                    break;
                case 'setCollaborationMode':
                    await this.agentManager.setCollaborationMode(data.mode);
                    vscode.window.showInformationMessage(`Collaboration mode: ${data.mode}`);
                    break;
                case 'generateMCPConfig':
                    try {
                        await this.mcpConfigGenerator.generateClaudeCodeConfig();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to generate MCP config: ${error}`);
                    }
                    break;
                case 'testMCPConnection':
                    const connected = this.mcpServer.isConnected();
                    webviewView.webview.postMessage({
                        type: 'mcpStatus',
                        connected
                    });
                    break;
                case 'getMCPStatus':
                    const mcpConnected = this.mcpServer.isConnected();
                    webviewView.webview.postMessage({
                        type: 'mcpStatus',
                        connected: mcpConnected
                    });
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
            <title>Claude Context Manager</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    overflow: hidden;
                }
                
                /* Tab System */
                .tabs {
                    display: flex;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                }
                .tab-button {
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    color: var(--vscode-tab-inactiveForeground);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                    font-size: 13px;
                }
                .tab-button:hover {
                    background: var(--vscode-tab-hoverBackground);
                }
                .tab-button.active {
                    color: var(--vscode-tab-activeForeground);
                    border-bottom-color: var(--vscode-tab-activeBorder);
                    background: var(--vscode-tab-activeBackground);
                }
                
                /* Tab Content */
                .tab-content {
                    padding: 16px;
                    display: none;
                    height: calc(100vh - 48px);
                    overflow-y: auto;
                }
                .tab-content.active {
                    display: block;
                }
                
                /* Cards */
                .status-card {
                    background: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .status-card h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                /* Buttons */
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px 4px 4px 0;
                    font-size: 12px;
                    transition: background-color 0.2s;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .btn-secondary:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                
                /* Agent Items */
                .agent-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .agent-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .agent-item.enabled {
                    background: var(--vscode-button-secondaryBackground);
                    border-color: var(--vscode-focusBorder);
                }
                .agent-emoji {
                    font-size: 20px;
                    margin-right: 12px;
                    width: 24px;
                    text-align: center;
                }
                .agent-info {
                    flex: 1;
                }
                .agent-name {
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 2px;
                }
                .agent-description {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 4px;
                }
                .agent-specializations {
                    font-size: 10px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.8;
                }
                .agent-toggle {
                    margin-left: auto;
                }
                
                /* Status Display */
                .status-summary {
                    background: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-top: 16px;
                    font-size: 12px;
                }
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .status-row:last-child {
                    margin-bottom: 0;
                }
                
                /* Context List */
                .context-list {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 4px;
                }
                .context-item {
                    padding: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    font-size: 12px;
                }
                .context-item:last-child {
                    border-bottom: none;
                }
                .context-type {
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .context-timestamp {
                    font-size: 10px;
                    color: var(--vscode-descriptionForeground);
                    margin: 4px 0;
                }
                .context-content {
                    line-height: 1.4;
                }
                
                /* Form Elements */
                label {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 12px;
                    cursor: pointer;
                }
                input[type="checkbox"] {
                    margin-right: 8px;
                }
                
                /* Collaboration Mode */
                .mode-selector {
                    display: flex;
                    gap: 4px;
                    margin-top: 8px;
                }
                .mode-btn {
                    padding: 4px 8px;
                    font-size: 10px;
                    border-radius: 3px;
                }
                .mode-btn.active {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
            </style>
        </head>
        <body>
            <!-- Tab Navigation -->
            <div class="tabs">
                <button class="tab-button active" onclick="showTab('general')">🏠 General</button>
                <button class="tab-button" onclick="showTab('agents')">🤖 Agents</button>
            </div>

            <!-- General Tab -->
            <div id="general-tab" class="tab-content active">
                <div class="status-card">
                    <h3>🏠 Project Status</h3>
                    <p>Project: <span id="project-name">Context Manager AI</span></p>
                    <p>Contexts: <span id="context-count">0</span></p>
                    <button class="btn" onclick="loadContexts()">🔄 Refresh</button>
                    <button class="btn btn-secondary" onclick="addTestContext()">➕ Add Test</button>
                </div>

                <div class="status-card">
                    <h3>⚙️ Auto-Capture Settings</h3>
                    <label>
                        <input type="checkbox" id="git-commits">
                        📝 Capture Git Commits
                    </label>
                    <label>
                        <input type="checkbox" id="file-changes">
                        📁 Monitor File Changes
                    </label>
                    <div id="capture-status" style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
                        Status: Loading...
                    </div>
                </div>

                <div class="status-card">
                    <h3>🔗 MCP Integration</h3>
                    <p>Status: <span id="mcp-status" style="font-weight: 600;">Disconnected</span></p>
                    <p>Claude Code: <span id="claude-code-status">Not configured</span></p>
                    <button class="btn" onclick="generateMCPConfig()">📋 Generate Config</button>
                    <button class="btn btn-secondary" onclick="testMCPConnection()">🔍 Test Connection</button>
                    <div id="mcp-info" style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
                        Configure MCP to connect with Claude Code
                    </div>
                </div>

                <div class="status-card">
                    <h3>📝 Recent Contexts</h3>
                    <div id="context-list" class="context-list">
                        <p style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">Loading contexts...</p>
                    </div>
                </div>
            </div>

            <!-- Agents Tab -->
            <div id="agents-tab" class="tab-content">
                <div class="status-card">
                    <h3>👥 AI Agents</h3>
                    <p style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 16px;">
                        Select which specialized agents are available for conversations:
                    </p>
                    
                    <div id="agents-list">
                        <!-- Agents will be loaded dynamically -->
                    </div>

                    <div class="status-summary">
                        <div class="status-row">
                            <span><strong>Active Agents:</strong></span>
                            <span id="active-agents-count">0 of 3</span>
                        </div>
                        <div class="status-row">
                            <span><strong>Mode:</strong></span>
                            <span id="collaboration-mode">Collaborative</span>
                        </div>
                        <div class="status-row">
                            <span><strong>Last Updated:</strong></span>
                            <span id="last-updated">Never</span>
                        </div>
                    </div>

                    <div style="margin-top: 16px;">
                        <p style="font-size: 11px; font-weight: 600; margin-bottom: 8px;">Collaboration Mode:</p>
                        <div class="mode-selector">
                            <button class="btn-secondary mode-btn active" onclick="setCollaborationMode('collaborative')">Collaborative</button>
                            <button class="btn-secondary mode-btn" onclick="setCollaborationMode('individual')">Individual</button>
                            <button class="btn-secondary mode-btn" onclick="setCollaborationMode('hierarchical')">Hierarchical</button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let currentAgents = [];

                // Tab Management
                function showTab(tabName) {
                    // Hide all tabs
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Show selected tab
                    document.getElementById(tabName + '-tab').classList.add('active');
                    event.target.classList.add('active');
                    
                    // Load data for specific tabs
                    if (tabName === 'agents') {
                        loadAgents();
                    }
                }

                // Context Management
                function loadContexts() {
                    vscode.postMessage({ type: 'getContexts' });
                }

                function addTestContext() {
                    vscode.postMessage({ type: 'addTestContext' });
                    setTimeout(loadContexts, 500);
                }

                function displayContexts(contexts) {
                    document.getElementById('context-count').textContent = contexts.length;
                    
                    const listEl = document.getElementById('context-list');
                    if (contexts.length === 0) {
                        listEl.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">No contexts yet</p>';
                        return;
                    }

                    listEl.innerHTML = contexts.map(ctx => 
                        \`<div class="context-item">
                            <div class="context-type">\${ctx.type.toUpperCase()}</div>
                            <div class="context-timestamp">\${new Date(ctx.timestamp).toLocaleString()}</div>
                            <div class="context-content">\${ctx.content.substring(0, 120)}...</div>
                        </div>\`
                    ).join('');
                }

                // Configuration Management
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

                // MCP Management
                function generateMCPConfig() {
                    vscode.postMessage({ type: 'generateMCPConfig' });
                }

                function testMCPConnection() {
                    vscode.postMessage({ type: 'testMCPConnection' });
                }

                function loadMCPStatus() {
                    vscode.postMessage({ type: 'getMCPStatus' });
                }

                function updateMCPStatus(connected) {
                    const statusElement = document.getElementById('mcp-status');
                    const infoElement = document.getElementById('mcp-info');
                    
                    if (connected) {
                        statusElement.textContent = 'Connected';
                        statusElement.style.color = 'var(--vscode-charts-green)';
                        infoElement.textContent = 'MCP server is running and ready';
                        document.getElementById('claude-code-status').textContent = 'Ready';
                    } else {
                        statusElement.textContent = 'Disconnected';
                        statusElement.style.color = 'var(--vscode-charts-red)';
                        infoElement.textContent = 'Generate config to connect with Claude Code';
                        document.getElementById('claude-code-status').textContent = 'Not configured';
                    }
                }

                function updateConfigUI(config, status) {
                    document.getElementById('git-commits').checked = config.capture.gitCommits;
                    document.getElementById('file-changes').checked = config.capture.fileChanges;
                    
                    const statusText = \`Git: \${status.gitMonitoring ? '✅' : '❌'} | Files: \${status.fileMonitoring ? '✅' : '❌'} | Workspace: \${status.workspaceActive ? '✅' : '❌'}\`;
                    document.getElementById('capture-status').textContent = statusText;
                }

                // Agent Management
                function loadAgents() {
                    vscode.postMessage({ type: 'getAgents' });
                }

                function toggleAgent(agentId) {
                    const checkbox = event.target;
                    const agentItem = checkbox.closest('.agent-item');
                    
                    if (checkbox.checked) {
                        agentItem.classList.add('enabled');
                    } else {
                        agentItem.classList.remove('enabled');
                    }
                    
                    updateAgentCount();
                    
                    vscode.postMessage({
                        type: 'toggleAgent',
                        agentId: agentId,
                        enabled: checkbox.checked
                    });
                }

                function setCollaborationMode(mode) {
                    // Update UI
                    document.querySelectorAll('.mode-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    event.target.classList.add('active');
                    
                    document.getElementById('collaboration-mode').textContent = 
                        mode.charAt(0).toUpperCase() + mode.slice(1);
                    
                    vscode.postMessage({
                        type: 'setCollaborationMode',
                        mode: mode
                    });
                }

                function displayAgents(agents, status) {
                    currentAgents = agents;
                    const listEl = document.getElementById('agents-list');
                    
                    listEl.innerHTML = agents.map(agent => \`
                        <div class="agent-item \${agent.enabled ? 'enabled' : ''}" data-agent="\${agent.id}">
                            <div class="agent-emoji">\${agent.emoji}</div>
                            <div class="agent-info">
                                <div class="agent-name">\${agent.name}</div>
                                <div class="agent-description">\${agent.description}</div>
                                <div class="agent-specializations">\${agent.specializations.join(' • ')}</div>
                            </div>
                            <label class="agent-toggle">
                                <input type="checkbox" \${agent.enabled ? 'checked' : ''} 
                                       onchange="toggleAgent('\${agent.id}')">
                            </label>
                        </div>
                    \`).join('');
                    
                    updateAgentStatus(status);
                }

                function updateAgentCount() {
                    const activeCount = document.querySelectorAll('.agent-item.enabled').length;
                    document.getElementById('active-agents-count').textContent = \`\${activeCount} of 3\`;
                }

                function updateAgentStatus(status) {
                    document.getElementById('active-agents-count').textContent = \`\${status.activeAgents} of \${status.totalAgents}\`;
                    document.getElementById('collaboration-mode').textContent = 
                        status.collaborationMode.charAt(0).toUpperCase() + status.collaborationMode.slice(1);
                    document.getElementById('last-updated').textContent = 
                        new Date(status.lastUpdated).toLocaleTimeString();
                }

                // Message Handler
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'contextsData':
                            displayContexts(message.contexts);
                            break;
                        case 'configData':
                            updateConfigUI(message.config, message.status);
                            break;
                        case 'agentsData':
                            displayAgents(message.agents, message.status);
                            break;
                        case 'mcpStatus':
                            updateMCPStatus(message.connected);
                            break;
                    }
                });

                // Event Listeners Setup
                function setupEventListeners() {
                    document.getElementById('git-commits').addEventListener('change', toggleGitCapture);
                    document.getElementById('file-changes').addEventListener('change', toggleFileCapture);
                }

                // Initialize
                function initialize() {
                    setupEventListeners();
                    loadContexts();
                    loadConfig();
                    loadMCPStatus();
                    // Agents will be loaded when tab is first opened
                }

                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initialize);
                } else {
                    initialize();
                }
            </script>
        </body>
        </html>`;
    }
}