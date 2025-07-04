import { IconProvider } from '../utils/icons';
import { i18n } from '../utils/i18n';

/**
 * General Tab Component
 * Handles the main dashboard with project status, settings, and recent contexts
 */
export class GeneralTab {
    private translations = i18n.getTranslations();

    /**
     * Generate the HTML content for the general tab
     */
    getHTML(): string {
        return `
            <div id="general-tab" class="tab-content active">
                ${this.getProjectStatusCard()}
                ${this.getAutoCaptureCard()}
                ${this.getMCPIntegrationCard()}
                ${this.getRecentContextsCard()}
            </div>
        `;
    }

    /**
     * Project status card
     */
    private getProjectStatusCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('folder')}</span>
                    ${this.translations.general.projectStatus}
                </div>
                <div class="card-content">
                    <div class="status-row">
                        <span>${this.translations.general.project}:</span>
                        <span id="project-name">Context Manager AI</span>
                    </div>
                    <div class="status-row">
                        <span>${this.translations.general.contexts}:</span>
                        <span id="context-count">0</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="loadContexts()">
                        <span class="icon">${IconProvider.getIcon('refresh')}</span>
                        ${this.translations.general.refresh}
                    </button>
                    <button class="btn btn-secondary" onclick="addTestContext()">
                        <span class="icon">${IconProvider.getIcon('plus')}</span>
                        ${this.translations.general.addTest}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Auto-capture settings card
     */
    private getAutoCaptureCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('settings')}</span>
                    ${this.translations.general.autoCaptureSettings}
                </div>
                <div class="card-content">
                    <label class="checkbox-label">
                        <input type="checkbox" id="git-commits" class="form-checkbox">
                        <span class="icon mr-2">${IconProvider.getIcon('git')}</span>
                        ${this.translations.general.captureGitCommits}
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="file-changes" class="form-checkbox">
                        <span class="icon mr-2">${IconProvider.getIcon('file')}</span>
                        ${this.translations.general.monitorFileChanges}
                    </label>
                </div>
                <div class="card-footer">
                    <div id="capture-status" class="status-indicator text-sm">
                        ${this.translations.general.status}: ${this.translations.general.loading}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * MCP Integration card
     */
    private getMCPIntegrationCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('link')}</span>
                    ${this.translations.general.mcpIntegration}
                </div>
                <div class="card-content">
                    <div class="status-row">
                        <span>${this.translations.general.status}:</span>
                        <span id="mcp-status" class="status-indicator status-disconnected">
                            ${this.translations.general.disconnected}
                        </span>
                    </div>
                    <div class="status-row">
                        <span>${this.translations.general.claudeCode}:</span>
                        <span id="claude-code-status">${this.translations.general.notConfigured}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="generateMCPConfig()">
                        <span class="icon">${IconProvider.getIcon('settings')}</span>
                        ${this.translations.general.generateConfig}
                    </button>
                    <button class="btn btn-secondary" onclick="testMCPConnection()">
                        <span class="icon">${IconProvider.getIcon('link')}</span>
                        ${this.translations.general.testConnection}
                    </button>
                </div>
                <div class="card-footer">
                    <div id="mcp-info" class="text-sm opacity-75">
                        ${this.translations.general.configure}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Recent contexts card
     */
    private getRecentContextsCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('clock')}</span>
                    ${this.translations.general.recentContexts}
                </div>
                <div class="card-content">
                    <div id="context-list" class="list">
                        <div class="list-item text-center opacity-75">
                            ${this.translations.general.loading}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get JavaScript functionality for the general tab
     */
    getScript(): string {
        return `
            // General tab functionality
            let generalTabState = {
                contexts: [],
                config: null,
                mcpStatus: false
            };

            // Context management
            function loadContexts() {
                console.log('📋 Loading contexts for general tab');
                vscode.postMessage({ type: 'getContexts' });
            }

            function addTestContext() {
                console.log('➕ Adding test context');
                vscode.postMessage({ type: 'addTestContext' });
                setTimeout(loadContexts, 500);
            }

            function displayContexts(contexts) {
                console.log('📊 Displaying', contexts.length, 'contexts');
                generalTabState.contexts = contexts;
                
                document.getElementById('context-count').textContent = contexts.length;
                
                const listEl = document.getElementById('context-list');
                if (contexts.length === 0) {
                    listEl.innerHTML = '<div class="list-item text-center opacity-75">' + t('general.noContexts') + '</div>';
                    return;
                }

                listEl.innerHTML = contexts.map((ctx, index) => 
                    '<div class="list-item" onclick="editContextById(\'' + ctx.id + '\')">' +
                        '<div class="context-header">' +
                            '<span class="context-type">' +
                                '<span class="icon">' + getContextTypeIcon(ctx.type) + '</span>' +
                                t('contextTypes.' + ctx.type) +
                            '</span>' +
                            '<span class="context-timestamp">' + formatTimestamp(ctx.timestamp) + '</span>' +
                        '</div>' +
                        '<div class="context-content">' + escapeHtml(ctx.content.substring(0, 120)) + '...</div>' +
                    '</div>'
                ).join('');
            }

            // Configuration management
            function loadConfig() {
                console.log('⚙️ Loading configuration');
                vscode.postMessage({ type: 'getConfig' });
            }

            function toggleGitCapture() {
                console.log('🔄 Toggling git capture');
                vscode.postMessage({ type: 'toggleGitCapture' });
                setTimeout(loadConfig, 300);
            }

            function toggleFileCapture() {
                console.log('🔄 Toggling file capture');
                vscode.postMessage({ type: 'toggleFileCapture' });
                setTimeout(loadConfig, 300);
            }

            function updateConfigUI(config, status) {
                console.log('🔧 Updating config UI', config, status);
                generalTabState.config = config;
                
                document.getElementById('git-commits').checked = config.capture.gitCommits;
                document.getElementById('file-changes').checked = config.capture.fileChanges;
                
                const statusText = 
                    'Git: ' + (status.gitMonitoring ? '✅' : '❌') + ' | ' +
                    'Files: ' + (status.fileMonitoring ? '✅' : '❌') + ' | ' +
                    'Workspace: ' + (status.workspaceActive ? '✅' : '❌');
                    
                document.getElementById('capture-status').textContent = t('general.status') + ': ' + statusText;
            }

            // MCP management
            function generateMCPConfig() {
                console.log('📋 Generating MCP config');
                vscode.postMessage({ type: 'generateMCPConfig' });
            }

            function testMCPConnection() {
                console.log('🔍 Testing MCP connection');
                vscode.postMessage({ type: 'testMCPConnection' });
            }

            function loadMCPStatus() {
                console.log('📡 Loading MCP status');
                vscode.postMessage({ type: 'getMCPStatus' });
            }

            function updateMCPStatus(connected) {
                console.log('📡 Updating MCP status:', connected);
                generalTabState.mcpStatus = connected;
                
                const statusElement = document.getElementById('mcp-status');
                const infoElement = document.getElementById('mcp-info');
                const claudeCodeElement = document.getElementById('claude-code-status');
                
                if (connected) {
                    statusElement.textContent = t('general.connected');
                    statusElement.className = 'status-indicator status-connected';
                    infoElement.textContent = 'MCP server is running and ready';
                    claudeCodeElement.textContent = t('general.ready');
                } else {
                    statusElement.textContent = t('general.disconnected');
                    statusElement.className = 'status-indicator status-disconnected';
                    infoElement.textContent = t('general.configure');
                    claudeCodeElement.textContent = t('general.notConfigured');
                }
            }

            // Helper function to get context type icon
            function getContextTypeIcon(type) {
                const icons = {
                    conversation: '${IconProvider.getIcon('messageSquare')}',
                    decision: '${IconProvider.getIcon('lightbulb')}',
                    code: '${IconProvider.getIcon('code')}',
                    issue: '${IconProvider.getIcon('alertCircle')}'
                };
                return icons[type] || '${IconProvider.getIcon('file')}';
            }

            // Initialize general tab
            function initGeneralTab() {
                console.log('🏠 Initializing general tab');
                
                // Set up event listeners
                document.getElementById('git-commits').addEventListener('change', toggleGitCapture);
                document.getElementById('file-changes').addEventListener('change', toggleFileCapture);
                
                // Load initial data
                loadContexts();
                loadConfig();
                loadMCPStatus();
            }

            // Listen for tab changes
            window.addEventListener('tabChanged', function(e) {
                if (e.detail.tabName === 'general') {
                    initGeneralTab();
                }
            });

            // Listen for DOM ready
            window.addEventListener('domReady', function() {
                if (currentTab === 'general') {
                    initGeneralTab();
                }
            });
        `;
    }
}