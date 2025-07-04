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
            console.log('📨 Received message from webview:', data.type, data);
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
                    // Refresh contexts in general tab
                    const refreshedContexts = await this.database.getContexts();
                    webviewView.webview.postMessage({
                        type: 'contextsData',
                        contexts: refreshedContexts.slice(0, 10)
                    });
                    // If user is on search tab, refresh search results too
                    webviewView.webview.postMessage({
                        type: 'refreshSearch'
                    });
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
                case 'searchContexts':
                    const searchResults = await this.searchContexts(data.query, data.filters);
                    webviewView.webview.postMessage({
                        type: 'searchResults',
                        results: searchResults,
                        query: data.query
                    });
                    break;
                case 'editContext':
                    const contextToEdit = await this.database.getContextById(data.contextId);
                    webviewView.webview.postMessage({
                        type: 'editContextData',
                        context: contextToEdit
                    });
                    break;
                case 'updateContext':
                    await this.database.updateContext(data.contextId, data.updates);
                    vscode.window.showInformationMessage('Context updated successfully');
                    break;
                case 'deleteContext':
                    console.log('🗑️ Deleting context:', data.contextId);
                    try {
                        await this.database.deleteContext(data.contextId);
                        console.log('✅ Context deleted successfully');
                        vscode.window.showInformationMessage('Context deleted');
                        // Refresh the current view
                        if (data.refreshType === 'search' && data.lastQuery) {
                            const refreshResults = await this.searchContexts(data.lastQuery, data.lastFilters);
                            webviewView.webview.postMessage({
                                type: 'searchResults',
                                results: refreshResults,
                                query: data.lastQuery
                            });
                        } else {
                            const refreshContexts = await this.database.getContexts();
                            webviewView.webview.postMessage({
                                type: 'contextsData',
                                contexts: refreshContexts.slice(0, 10)
                            });
                        }
                    } catch (error) {
                        console.error('❌ Error deleting context:', error);
                        vscode.window.showErrorMessage(`Failed to delete context: ${error}`);
                    }
                    break;
                case 'deleteMultipleContexts':
                    const deletePromises = data.contextIds.map((id: string) => this.database.deleteContext(id));
                    await Promise.all(deletePromises);
                    vscode.window.showInformationMessage(`${data.contextIds.length} contexts deleted`);
                    // Refresh current view
                    if (data.refreshType === 'search' && data.lastQuery) {
                        const refreshResults = await this.searchContexts(data.lastQuery, data.lastFilters);
                        webviewView.webview.postMessage({
                            type: 'searchResults',
                            results: refreshResults,
                            query: data.lastQuery
                        });
                    } else {
                        const refreshContexts = await this.database.getContexts();
                        webviewView.webview.postMessage({
                            type: 'contextsData',
                            contexts: refreshContexts.slice(0, 10)
                        });
                    }
                    break;
            }
        });

        Logger.info('Webview provider initialized');
    }

    private async searchContexts(query: string, filters: any = {}) {
        const allContexts = await this.database.getContexts();
        
        let filteredContexts = allContexts;

        // Apply type filter
        if (filters.type && filters.type !== 'all') {
            filteredContexts = filteredContexts.filter(ctx => ctx.type === filters.type);
        }

        // Apply date filter
        if (filters.dateRange) {
            const now = new Date();
            let startDate: Date;
            
            switch (filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(0);
            }
            
            filteredContexts = filteredContexts.filter(ctx => 
                new Date(ctx.timestamp) >= startDate
            );
        }

        // Apply text search
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            filteredContexts = filteredContexts.filter(ctx => 
                ctx.content.toLowerCase().includes(searchTerm) ||
                ctx.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by relevance (importance + timestamp)
        filteredContexts.sort((a, b) => {
            const scoreA = a.importance + (new Date(a.timestamp).getTime() / 1000000000);
            const scoreB = b.importance + (new Date(b.timestamp).getTime() / 1000000000);
            return scoreB - scoreA;
        });

        return filteredContexts.slice(0, 50); // Limit results
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
                <button class="tab-button" onclick="showTab('search')">🔍 Search</button>
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

            <!-- Search Tab -->
            <div id="search-tab" class="tab-content">
                <div class="status-card">
                    <h3>🔍 Search Contexts</h3>
                    
                    <!-- Search Form -->
                    <div style="margin-bottom: 16px;">
                        <input type="text" id="search-query" placeholder="Search contexts..." 
                               style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border); 
                                      background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                      border-radius: 4px; font-size: 12px;">
                    </div>
                    
                    <!-- Filters -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
                        <select id="type-filter" style="padding: 4px 8px; border: 1px solid var(--vscode-input-border); 
                                                        background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                        border-radius: 4px; font-size: 11px;">
                            <option value="all">All Types</option>
                            <option value="conversation">Conversation</option>
                            <option value="decision">Decision</option>
                            <option value="code">Code</option>
                            <option value="issue">Issue</option>
                        </select>
                        
                        <select id="date-filter" style="padding: 4px 8px; border: 1px solid var(--vscode-input-border); 
                                                        background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                        border-radius: 4px; font-size: 11px;">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                        
                        <button class="btn btn-secondary" onclick="clearSearch()" style="font-size: 11px; padding: 4px 8px;">
                            🧹 Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Search Results -->
                <div class="status-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0;">📋 Results</h3>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span id="search-count" style="font-size: 11px; color: var(--vscode-descriptionForeground);">0 results</span>
                            <div id="selection-controls" style="display: none; gap: 4px;">
                                <button class="btn btn-secondary" onclick="selectAllContexts()" style="font-size: 10px; padding: 2px 6px;">
                                    ☑️ All
                                </button>
                                <button class="btn btn-secondary" onclick="clearSelection()" style="font-size: 10px; padding: 2px 6px;">
                                    ◻️ None
                                </button>
                                <button class="btn" onclick="deleteSelectedContexts()" style="font-size: 10px; padding: 2px 6px; background: var(--vscode-errorForeground);">
                                    🗑️ Delete <span id="selected-count">0</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="search-results" style="max-height: 400px; overflow-y: auto;">
                        <p style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
                            Loading all contexts...
                        </p>
                    </div>
                </div>
            </div>

            <!-- Edit Context Modal -->
            <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                                       background: rgba(0,0,0,0.5); z-index: 1000; padding: 20px;">
                <div style="background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px; max-width: 500px; margin: 20px auto; padding: 20px; max-height: 80vh; overflow-y: auto;">
                    <h3 style="margin-top: 0;">✏️ Edit Context</h3>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Content:</label>
                        <textarea id="edit-content" rows="5" style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                                                    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                                    border-radius: 4px; font-size: 12px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Type:</label>
                        <select id="edit-type" style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                                     background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                     border-radius: 4px; font-size: 12px;">
                            <option value="conversation">Conversation</option>
                            <option value="decision">Decision</option>
                            <option value="code">Code</option>
                            <option value="issue">Issue</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Importance (1-10):</label>
                        <input type="range" id="edit-importance" min="1" max="10" value="5" 
                               style="width: 100%; margin-bottom: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--vscode-descriptionForeground);">
                            <span>1 (Low)</span>
                            <span id="importance-value">5</span>
                            <span>10 (High)</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Tags (comma separated):</label>
                        <input type="text" id="edit-tags" placeholder="tag1, tag2, tag3" 
                               style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                      background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                      border-radius: 4px; font-size: 12px;">
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                        <button class="btn" onclick="saveContext()">Save Changes</button>
                        <button class="btn" onclick="deleteContext()" style="background: var(--vscode-errorForeground);">Delete</button>
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
                    } else if (tabName === 'search') {
                        // Load all contexts by default on search tab
                        loadAllContextsForSearch();
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
                        case 'searchResults':
                            displaySearchResults(message.results, message.query);
                            break;
                        case 'editContextData':
                            showEditModal(message.context);
                            break;
                        case 'refreshSearch':
                            // If we're on the search tab, refresh the current search
                            const activeTab = document.querySelector('.tab-button.active');
                            if (activeTab && activeTab.textContent.includes('Search')) {
                                loadAllContextsForSearch();
                            }
                            break;
                    }
                });

                // Search Functions
                let currentSearchQuery = '';
                let currentSearchFilters = {};
                let currentEditingContextId = null;
                let selectedContextIds = new Set();
                let searchTimeout = null;

                function performSearch() {
                    const query = document.getElementById('search-query').value;
                    const typeFilter = document.getElementById('type-filter').value;
                    const dateFilter = document.getElementById('date-filter').value;
                    
                    currentSearchQuery = query;
                    currentSearchFilters = {
                        type: typeFilter,
                        dateRange: dateFilter
                    };
                    
                    vscode.postMessage({
                        type: 'searchContexts',
                        query: query,
                        filters: currentSearchFilters
                    });
                }

                function performSearchWithDelay() {
                    // Clear previous timeout
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }
                    
                    // Set new timeout for real-time search
                    searchTimeout = setTimeout(() => {
                        performSearch();
                    }, 300); // 300ms delay
                }

                function loadAllContextsForSearch() {
                    console.log('📋 Loading all contexts for search tab');
                    // Load all contexts without any query (empty search shows all)
                    const message = {
                        type: 'searchContexts',
                        query: '',
                        filters: {
                            type: 'all',
                            dateRange: 'all'
                        }
                    };
                    console.log('📤 Sending search message:', message);
                    vscode.postMessage(message);
                }

                function clearSearch() {
                    document.getElementById('search-query').value = '';
                    document.getElementById('type-filter').value = 'all';
                    document.getElementById('date-filter').value = 'all';
                    
                    // Clear selection
                    selectedContextIds.clear();
                    
                    currentSearchQuery = '';
                    currentSearchFilters = {};
                    
                    // Reload all contexts
                    loadAllContextsForSearch();
                }

                function displaySearchResults(results, query) {
                    const resultsEl = document.getElementById('search-results');
                    const countEl = document.getElementById('search-count');
                    const selectionControls = document.getElementById('selection-controls');
                    
                    countEl.textContent = \`\${results.length} result\${results.length !== 1 ? 's' : ''}\`;
                    
                    if (results.length === 0) {
                        resultsEl.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">No contexts found</p>';
                        selectionControls.style.display = 'none';
                        return;
                    }

                    // Show selection controls when there are results
                    selectionControls.style.display = 'flex';
                    
                    resultsEl.innerHTML = results.map(ctx => \`
                        <div class="context-item" style="margin-bottom: 8px; padding: 12px; 
                                                          border: 1px solid var(--vscode-panel-border); border-radius: 4px;
                                                          background: var(--vscode-editorWidget-background);
                                                          position: relative;" 
                             data-context-id="\${ctx.id}">
                            <div style="display: flex; align-items: flex-start; gap: 8px;">
                                <input type="checkbox" class="context-checkbox" value="\${ctx.id}" 
                                       onchange="toggleContextSelection('\${ctx.id}')"
                                       style="margin-top: 4px; cursor: pointer;">
                                <div style="flex: 1; cursor: pointer;" onclick="editContextById('\${ctx.id}')">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                        <div class="context-type" style="font-size: 10px; font-weight: 600; 
                                                                         background: var(--vscode-button-background); color: var(--vscode-button-foreground);
                                                                         padding: 2px 6px; border-radius: 3px;">\${ctx.type.toUpperCase()}</div>
                                        <div class="context-timestamp" style="font-size: 10px; color: var(--vscode-descriptionForeground);">
                                            \${new Date(ctx.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="context-content" style="font-size: 12px; line-height: 1.4; margin-bottom: 8px;">
                                        \${highlightSearchTerm(ctx.content.substring(0, 300), query)}...
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div class="context-tags" style="font-size: 10px; color: var(--vscode-descriptionForeground);">
                                            📎 \${ctx.tags.join(', ') || 'no tags'}
                                        </div>
                                        <div style="display: flex; gap: 12px; font-size: 10px; color: var(--vscode-descriptionForeground);">
                                            <span>⭐ \${ctx.importance}/10</span>
                                            <button style="cursor: pointer; color: var(--vscode-errorForeground); background: none; border: none; font-size: 12px;" 
                                                    onclick="event.stopPropagation(); deleteContextById('\${ctx.id}')" 
                                                    title="Delete this context">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                    
                    updateSelectionCount();
                }

                function highlightSearchTerm(text, query) {
                    if (!query || !query.trim()) return text;
                    // Simple case-insensitive search without regex to avoid escape issues
                    const lowerText = text.toLowerCase();
                    const lowerQuery = query.toLowerCase();
                    const index = lowerText.indexOf(lowerQuery);
                    
                    if (index === -1) return text;
                    
                    const before = text.substring(0, index);
                    const match = text.substring(index, index + query.length);
                    const after = text.substring(index + query.length);
                    
                    return before + '<mark style="background: var(--vscode-editor-findMatchHighlightBackground);">' + match + '</mark>' + after;
                }

                // Edit Context Functions
                function editContextById(contextId) {
                    currentEditingContextId = contextId;
                    vscode.postMessage({
                        type: 'editContext',
                        contextId: contextId
                    });
                }

                function showEditModal(context) {
                    if (!context) return;
                    
                    document.getElementById('edit-content').value = context.content;
                    document.getElementById('edit-type').value = context.type;
                    document.getElementById('edit-importance').value = context.importance;
                    document.getElementById('importance-value').textContent = context.importance;
                    document.getElementById('edit-tags').value = context.tags.join(', ');
                    
                    document.getElementById('edit-modal').style.display = 'block';
                }

                function closeEditModal() {
                    document.getElementById('edit-modal').style.display = 'none';
                    currentEditingContextId = null;
                }

                function saveContext() {
                    if (!currentEditingContextId) return;
                    
                    const content = document.getElementById('edit-content').value;
                    const type = document.getElementById('edit-type').value;
                    const importance = parseInt(document.getElementById('edit-importance').value);
                    const tagsText = document.getElementById('edit-tags').value;
                    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                    
                    if (!content.trim()) {
                        alert('Content cannot be empty');
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'updateContext',
                        contextId: currentEditingContextId,
                        updates: {
                            content,
                            type,
                            importance,
                            tags
                        },
                        refreshType: currentSearchQuery ? 'search' : 'general',
                        lastQuery: currentSearchQuery,
                        lastFilters: currentSearchFilters
                    });
                    
                    closeEditModal();
                }

                // Selection Functions
                function toggleContextSelection(contextId) {
                    if (selectedContextIds.has(contextId)) {
                        selectedContextIds.delete(contextId);
                    } else {
                        selectedContextIds.add(contextId);
                    }
                    updateSelectionCount();
                }

                function selectAllContexts() {
                    const checkboxes = document.querySelectorAll('.context-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = true;
                        selectedContextIds.add(checkbox.value);
                    });
                    updateSelectionCount();
                }

                function clearSelection() {
                    const checkboxes = document.querySelectorAll('.context-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    selectedContextIds.clear();
                    updateSelectionCount();
                }

                function updateSelectionCount() {
                    const selectedCount = selectedContextIds.size;
                    document.getElementById('selected-count').textContent = selectedCount;
                    
                    const deleteBtn = document.querySelector('#selection-controls button[onclick="deleteSelectedContexts()"]');
                    if (deleteBtn) {
                        deleteBtn.style.display = selectedCount > 0 ? 'inline-block' : 'none';
                    }
                }

                function deleteSelectedContexts() {
                    if (selectedContextIds.size === 0) return;
                    
                    const count = selectedContextIds.size;
                    if (!confirm(\`Are you sure you want to delete \${count} selected context\${count > 1 ? 's' : ''}? This action cannot be undone.\`)) {
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'deleteMultipleContexts',
                        contextIds: Array.from(selectedContextIds),
                        refreshType: currentSearchQuery ? 'search' : 'general',
                        lastQuery: currentSearchQuery,
                        lastFilters: currentSearchFilters
                    });
                    
                    selectedContextIds.clear();
                    updateSelectionCount();
                }

                function deleteContextById(contextId) {
                    console.log('🗑️ deleteContextById called with:', contextId);
                    console.log('Current search query:', currentSearchQuery);
                    console.log('Current filters:', currentSearchFilters);
                    
                    if (!confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
                        console.log('Delete cancelled by user');
                        return;
                    }
                    
                    const message = {
                        type: 'deleteContext',
                        contextId: contextId,
                        refreshType: currentSearchQuery ? 'search' : 'general',
                        lastQuery: currentSearchQuery,
                        lastFilters: currentSearchFilters
                    };
                    
                    console.log('📤 Sending delete message:', message);
                    vscode.postMessage(message);
                }

                function deleteContext() {
                    if (!currentEditingContextId) return;
                    
                    if (!confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'deleteContext',
                        contextId: currentEditingContextId,
                        refreshType: currentSearchQuery ? 'search' : 'general',
                        lastQuery: currentSearchQuery,
                        lastFilters: currentSearchFilters
                    });
                    
                    closeEditModal();
                }

                // Event Listeners Setup
                function setupEventListeners() {
                    document.getElementById('git-commits').addEventListener('change', toggleGitCapture);
                    document.getElementById('file-changes').addEventListener('change', toggleFileCapture);
                    
                    // Search event listeners - real-time search
                    document.getElementById('search-query').addEventListener('input', function(e) {
                        performSearchWithDelay();
                    });
                    
                    document.getElementById('search-query').addEventListener('keyup', function(e) {
                        if (e.key === 'Enter') {
                            performSearch();
                        }
                    });
                    
                    // Filter change listeners
                    document.getElementById('type-filter').addEventListener('change', function(e) {
                        performSearchWithDelay();
                    });
                    
                    document.getElementById('date-filter').addEventListener('change', function(e) {
                        performSearchWithDelay();
                    });
                    
                    // Importance slider listener
                    document.getElementById('edit-importance').addEventListener('input', function(e) {
                        document.getElementById('importance-value').textContent = e.target.value;
                    });
                    
                    // Close modal on outside click
                    document.getElementById('edit-modal').addEventListener('click', function(e) {
                        if (e.target === this) {
                            closeEditModal();
                        }
                    });
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