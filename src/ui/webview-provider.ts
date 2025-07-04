import * as vscode from 'vscode';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { AutoCapture } from '../capture/auto-capture';
import { AgentManager } from '../agents/agent-manager';
import { MCPServer } from '../mcp/server';
import { MCPConfigGenerator } from '../mcp/config-generator';
import { Logger } from '../utils/logger';

// Import modular components
import { BaseTemplate } from './templates/base-template';
import { GeneralTab } from './components/general-tab';
import { AgentsTab } from './components/agents-tab';
import { SearchTab } from './components/search-tab';
import { EditModal } from './components/edit-modal';
import { i18n } from './utils/i18n';
import { CSS_STYLES } from './styles/css';

/**
 * Modular WebView Provider for Claude Context Manager
 * Clean, maintainable architecture with component-based UI
 */
export class ModularWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';

    // UI Components
    private generalTab = new GeneralTab();
    private agentsTab = new AgentsTab();
    private searchTab = new SearchTab();
    private editModal = new EditModal();

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase,
        private readonly configStore: ConfigStore,
        private readonly autoCapture: AutoCapture,
        private readonly agentManager: AgentManager,
        private readonly mcpServer: MCPServer,
        private readonly mcpConfigGenerator: MCPConfigGenerator
    ) {
        // Initialize i18n with user's preferred language
        this.initializeLanguage();
    }

    /**
     * Initialize language based on VS Code locale
     */
    private initializeLanguage(): void {
        const vscodeLocale = vscode.env.language;
        if (vscodeLocale.startsWith('en')) {
            i18n.setLanguage('en');
        } else {
            i18n.setLanguage('es'); // Default to Spanish per user preference
        }
        Logger.info(`Language initialized: ${i18n.getCurrentLanguage()}`);
    }

    /**
     * Resolve webview view - main entry point
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        // Configure webview options
        webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
            enableForms: true,
            localResourceRoots: [this.extensionUri]
        };

        // Generate HTML content
        webviewView.webview.html = this.generateHTML();

        // Set up message handling
        this.setupMessageHandling(webviewView);

        Logger.info('Modular webview provider initialized successfully - ALL LEGACY FUNCTIONALITY MIGRATED');
    }

    /**
     * Generate complete HTML using modular components
     */
    private generateHTML(): string {
        const content = `
            ${BaseTemplate.createTabs()}
            ${this.generalTab.getHTML()}
            ${this.agentsTab.getHTML()}
            ${this.searchTab.getHTML()}
            ${this.editModal.getHTML()}
        `;

        const script = `
            ${this.generalTab.getScript()}
            ${this.agentsTab.getScript()}
            ${this.searchTab.getScript()}
            ${this.editModal.getScript()}
        `;

        // Load CSS content from TypeScript module
        const cssContent = CSS_STYLES;
        
        return BaseTemplate.getHTML(content + `<script>${script}</script>`) + 
               `<style>${cssContent}</style>`;
    }


    /**
     * Set up message handling between webview and extension
     * FULLY MIGRATED from legacy - includes all message types and error handling
     */
    private setupMessageHandling(webviewView: vscode.WebviewView): void {
        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log('📨 Received message from webview:', data.type, data);
            
            try {
                await this.handleMessage(data, webviewView);
            } catch (error) {
                Logger.error(`Error handling message ${data.type}:`, error as Error);
                console.error('❌ Error details:', error);
                vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }

    /**
     * Handle messages from webview - clean and organized
     * Migrated from legacy webview-provider.ts with full functionality
     */
    private async handleMessage(data: any, webviewView: vscode.WebviewView): Promise<void> {
        switch (data.type) {
            // Context management
            case 'getContexts':
                await this.handleGetContexts(webviewView);
                break;
            case 'addTestContext':
                await this.handleAddTestContext(webviewView);
                break;
            case 'searchContexts':
                await this.handleSearchContexts(data, webviewView);
                break;
            case 'editContext':
                await this.handleEditContext(data, webviewView);
                break;
            case 'updateContext':
                await this.handleUpdateContext(data, webviewView);
                break;
            case 'deleteContext':
                await this.handleDeleteContext(data, webviewView);
                break;
            case 'deleteMultipleContexts':
                await this.handleDeleteMultipleContexts(data, webviewView);
                break;

            // Configuration management
            case 'getConfig':
                await this.handleGetConfig(webviewView);
                break;
            case 'toggleGitCapture':
                await this.handleToggleGitCapture(webviewView);
                break;
            case 'toggleFileCapture':
                await this.handleToggleFileCapture(webviewView);
                break;

            // Agent management
            case 'getAgents':
                await this.handleGetAgents(webviewView);
                break;
            case 'toggleAgent':
                await this.handleToggleAgent(data, webviewView);
                break;
            case 'setCollaborationMode':
                await this.handleSetCollaborationMode(data, webviewView);
                break;

            // MCP management
            case 'generateMCPConfig':
                await this.handleGenerateMCPConfig();
                break;
            case 'testMCPConnection':
                await this.handleTestMCPConnection(webviewView);
                break;
            case 'getMCPStatus':
                await this.handleGetMCPStatus(webviewView);
                break;

            // Language management
            case 'changeLanguage':
                await this.handleChangeLanguage(data, webviewView);
                break;

            // Legacy compatibility - ensure all message types are handled
            case 'refreshSearch':
                // This is handled automatically by refresh logic
                Logger.info('RefreshSearch message received - handled automatically');
                break;

            default:
                Logger.info(`Unknown message type: ${data.type}`);
        }
    }

    // ===== MESSAGE HANDLERS =====

    private async handleGetContexts(webviewView: vscode.WebviewView): Promise<void> {
        const contexts = await this.database.getContexts();
        Logger.info(`Retrieved ${contexts.length} contexts for general tab`);
        
        webviewView.webview.postMessage({
            type: 'contextsData',
            contexts: contexts.slice(0, 10) // Latest 10
        });
    }

    private async handleAddTestContext(webviewView: vscode.WebviewView): Promise<void> {
        await this.autoCapture.captureManualContext(
            'conversation',
            'Test context entry created from modular panel',
            5,
            ['test', 'modular', 'refactored']
        );

        vscode.window.showInformationMessage(i18n.t('messages.testContextAdded'));
        
        // Refresh both general and search tabs (LEGACY COMPATIBILITY)
        const refreshedContexts = await this.database.getContexts();
        webviewView.webview.postMessage({
            type: 'contextsData',
            contexts: refreshedContexts.slice(0, 10)
        });
        // Send refreshSearch signal to update search tab if active
        webviewView.webview.postMessage({
            type: 'refreshSearch'
        });
    }

    private async handleSearchContexts(data: any, webviewView: vscode.WebviewView): Promise<void> {
        const searchResults = await this.searchContexts(data.query, data.filters);
        Logger.info(`Search completed: found ${searchResults.length} results`);
        
        webviewView.webview.postMessage({
            type: 'searchResults',
            results: searchResults,
            query: data.query
        });
    }

    private async handleEditContext(data: any, webviewView: vscode.WebviewView): Promise<void> {
        const contextToEdit = await this.database.getContextById(data.contextId);
        if (!contextToEdit) {
            throw new Error(`Context not found: ${data.contextId}`);
        }
        
        webviewView.webview.postMessage({
            type: 'editContextData',
            context: contextToEdit
        });
    }

    private async handleUpdateContext(data: any, webviewView: vscode.WebviewView): Promise<void> {
        await this.database.updateContext(data.contextId, data.updates);
        vscode.window.showInformationMessage(i18n.t('messages.contextUpdated'));
        
        // Refresh appropriate view
        await this.refreshCurrentView(data, webviewView);
    }

    private async handleDeleteContext(data: any, webviewView: vscode.WebviewView): Promise<void> {
        Logger.info(`Deleting context: ${data.contextId}`);
        
        await this.database.deleteContext(data.contextId);
        vscode.window.showInformationMessage(i18n.t('messages.contextDeleted'));
        
        // Refresh appropriate view
        await this.refreshCurrentView(data, webviewView);
    }

    private async handleDeleteMultipleContexts(data: any, webviewView: vscode.WebviewView): Promise<void> {
        const deletePromises = data.contextIds.map((id: string) => this.database.deleteContext(id));
        await Promise.all(deletePromises);
        
        const count = data.contextIds.length;
        const message = i18n.t('messages.deleteMultipleConfirm', { 
            count, 
            plural: i18n.plural(count) 
        }).replace('?', '.');
        vscode.window.showInformationMessage(message);
        
        // Refresh appropriate view
        await this.refreshCurrentView(data, webviewView);
    }

    private async handleGetConfig(webviewView: vscode.WebviewView): Promise<void> {
        const config = this.configStore.getConfig();
        const status = this.autoCapture.getStatus();
        
        webviewView.webview.postMessage({
            type: 'configData',
            config,
            status
        });
    }

    private async handleToggleGitCapture(webviewView: vscode.WebviewView): Promise<void> {
        await this.autoCapture.toggleGitMonitoring();
        vscode.window.showInformationMessage(i18n.t('messages.settingsUpdated'));
        
        // Refresh config
        await this.handleGetConfig(webviewView);
    }

    private async handleToggleFileCapture(webviewView: vscode.WebviewView): Promise<void> {
        await this.autoCapture.toggleFileMonitoring();
        vscode.window.showInformationMessage(i18n.t('messages.settingsUpdated'));
        
        // Refresh config
        await this.handleGetConfig(webviewView);
    }

    private async handleGetAgents(webviewView: vscode.WebviewView): Promise<void> {
        const agents = this.agentManager.getAllAgents();
        const agentStatus = this.agentManager.getAgentStatus();
        
        webviewView.webview.postMessage({
            type: 'agentsData',
            agents,
            status: agentStatus
        });
    }

    private async handleToggleAgent(data: any, webviewView: vscode.WebviewView): Promise<void> {
        await this.agentManager.toggleAgent(data.agentId);
        const status = data.enabled ? i18n.t('status.enabled') : i18n.t('status.disabled');
        vscode.window.showInformationMessage(`Agent ${data.agentId} ${status}`);
        
        // Refresh agents
        await this.handleGetAgents(webviewView);
    }

    private async handleSetCollaborationMode(data: any, webviewView: vscode.WebviewView): Promise<void> {
        await this.agentManager.setCollaborationMode(data.mode);
        vscode.window.showInformationMessage(`${i18n.t('agents.collaborationMode')}: ${i18n.t('agents.' + data.mode)}`);
        
        // Refresh agents
        await this.handleGetAgents(webviewView);
    }

    private async handleGenerateMCPConfig(): Promise<void> {
        try {
            await this.mcpConfigGenerator.generateClaudeCodeConfig();
            vscode.window.showInformationMessage(i18n.t('messages.configGenerated'));
        } catch (error) {
            throw new Error(`Failed to generate MCP config: ${error}`);
        }
    }

    private async handleTestMCPConnection(webviewView: vscode.WebviewView): Promise<void> {
        const connected = this.mcpServer.isConnected();
        webviewView.webview.postMessage({
            type: 'mcpStatus',
            connected
        });
    }

    private async handleGetMCPStatus(webviewView: vscode.WebviewView): Promise<void> {
        const connected = this.mcpServer.isConnected();
        webviewView.webview.postMessage({
            type: 'mcpStatus',
            connected
        });
    }

    private async handleChangeLanguage(data: any, webviewView: vscode.WebviewView): Promise<void> {
        i18n.setLanguage(data.language);
        Logger.info(`Language changed to: ${data.language}`);
        
        // Regenerate HTML with new language
        webviewView.webview.html = this.generateHTML();
        
        vscode.window.showInformationMessage(`Language changed to ${data.language}`);
    }

    // ===== HELPER METHODS =====

    /**
     * Search contexts with filters - MIGRATED from legacy with full functionality
     * Includes all filtering logic: type, date range, text search, and relevance sorting
     */
    private async searchContexts(query: string, filters: any = {}): Promise<any[]> {
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

    /**
     * Refresh the current view based on context
     */
    private async refreshCurrentView(data: any, webviewView: vscode.WebviewView): Promise<void> {
        if (data.refreshType === 'search' && data.lastQuery !== undefined) {
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
    }
}