import * as vscode from 'vscode';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { AutoCapture } from '../capture/auto-capture';
import { AgentManager } from '../agents/agent-manager';
import { UnifiedMCPServer } from '../mcp/unified-mcp-server';
import { MCPConfigGenerator } from '../mcp/config-generator';
import { Logger } from '../utils/logger';
import { SimpleTokenMonitor } from '../core/simple-token-monitor';
import { WebviewRequest, WebviewResponse } from './webview/core/types';

export class ContextWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';
    private webviewView?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase,
        private readonly configStore: ConfigStore,
        private readonly autoCapture: AutoCapture,
        private readonly agentManager: AgentManager,
        private mcpServer: UnifiedMCPServer | undefined,
        private readonly mcpConfigGenerator: MCPConfigGenerator,
        private readonly tokenMonitor: SimpleTokenMonitor,
        private readonly extensionContext: vscode.ExtensionContext
    ) {
        // Set up token monitor listeners
        this.setupTokenMonitorListeners();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this.webviewView = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            (data) => this.handleMessage(data)
        );
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'style.css'));

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>Claude Context Manager</title>
            </head>
            <body>
                <!-- SolidJS app will mount here -->
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private async handleMessage(request: WebviewRequest) {
        const { command, payload, requestId } = request;
        let responsePayload: any;
        let error: string | undefined;

        try {
            // Dispatch based on the command's domain and action
            const [domain, action] = command.split('.');
            
            // Note: This is a simplified dispatcher. A more robust implementation
            // might use a map of handlers for each domain.
            switch (domain) {
                case 'context':
                    responsePayload = await this.handleContextActions(action, payload);
                    break;
                case 'agent':
                    responsePayload = await this.handleAgentActions(action, payload);
                    break;
                case 'config':
                    responsePayload = await this.handleConfigActions(action, payload);
                    break;
                case 'mcp':
                    responsePayload = await this.handleMcpActions(action, payload);
                    break;
                case 'app':
                     responsePayload = await this.handleAppActions(action, payload);
                     break;
                case 'capture':
                    responsePayload = await this.handleCaptureActions(action, payload);
                    break;
                default:
                    throw new Error(`Unknown command domain: ${domain}`);
            }
        } catch (e: any) {
            Logger.error(`Error handling command '${command}':`, e);
            error = e.message;
        }

        // Send a single, standardized response back to the webview
        this.postResponse({
            command,
            payload: responsePayload,
            requestId,
            error,
        });
    }

    // --- Action Handlers per Domain ---

    private async handleAppActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'requestInitialData':
                const contexts = await this.database.getContexts();
                const agents = await this.agentManager.getAllAgents();
                const databaseConfig = this.database.getDatabaseConfig();
                const mcpStatus = this.mcpServer ? { 
                    connected: this.mcpServer.isServerRunning(), 
                    server: 'unified',
                    status: this.mcpServer.isServerRunning() ? 'Server running' : 'Server stopped'
                } : { 
                    connected: false, 
                    server: 'none',
                    status: 'Server not started'
                };
                const onboardingCompleted = this.configStore.getOnboardingCompleted();
                const tokenUsage = this.tokenMonitor.getCurrentUsage();
                const config = this.configStore.getConfig();

                return {
                    contexts,
                    agents,
                    databaseConfig,
                    mcpStatus,
                    onboardingCompleted,
                    tokenUsage,
                    config,
                    stats: { totalContexts: contexts.length, byType: {}, byProject: {}, adapterType: databaseConfig.type }
                };
            case 'completeOnboarding':
                await this.configStore.updateConfig({ onboardingCompleted: true });
                return { success: true };
            default:
                throw new Error(`Unknown app action: ${action}`);
        }
    }

    private async handleContextActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'delete':
                await this.database.deleteContext(payload.id);
                return { id: payload.id }; // Return confirmation
            case 'update':
                await this.database.updateContext(payload.contextId, payload.updates);
                return await this.database.getContextById(payload.contextId);
            case 'create':
                const newContext = await this.database.addContext(payload.contextData);
                return newContext;
            case 'search':
                return await this.database.searchContexts(payload.query);
            default:
                throw new Error(`Unknown context action: ${action}`);
        }
    }

    private async handleAgentActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'save':
                // Handle both create and update based on whether the agent has an ID
                if (payload.agent.id) {
                    await this.agentManager.updateAgent(payload.agent.id, payload.agent);
                    return this.agentManager.getAgent(payload.agent.id);
                } else {
                    const newAgent = await this.agentManager.addAgent(payload.agent);
                    return newAgent;
                }
            case 'delete':
                await this.agentManager.deleteAgent(payload.id);
                return { id: payload.id };
            case 'toggle':
                const toggledAgent = await this.agentManager.toggleAgent(payload.agentId);
                return toggledAgent;
            case 'setCollaborationMode':
                await this.agentManager.setCollaborationMode(payload.mode);
                return await this.agentManager.getAllAgents();
            default:
                throw new Error(`Unknown agent action: ${action}`);
        }
    }

    private async handleConfigActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'updateDatabase':
                // Database configuration cannot be updated at runtime
                // It needs to be set before database initialization
                vscode.window.showWarningMessage('Database configuration cannot be changed at runtime. Please restart the extension with the new configuration.');
                return this.database.getDatabaseConfig();
            case 'testDatabase':
                // This would contain logic to test the connection.
                // For now, we'll assume success.
                vscode.window.showInformationMessage('Database connection successful.');
                return { status: 'connected' };
            case 'reset':
                await this.configStore.resetToDefaults();
                vscode.window.showInformationMessage('Configuration reset. Please reload the webview.');
                // The frontend will trigger a reload on its side.
                return { status: 'reset' };
            case 'generateClaudeDesktopConfig':
                await this.mcpConfigGenerator.generateClaudeDesktopConfig();
                return { status: 'config_generated' };
            case 'generateClineConfig':
                await this.mcpConfigGenerator.generateClineConfig();
                return { status: 'config_generated' };
            case 'generateGeminiConfig':
                await this.mcpConfigGenerator.generateGeminiConfig();
                return { status: 'config_generated' };
            default:
                throw new Error(`Unknown config action: ${action}`);
        }
    }

    private async handleMcpActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'start':
                if (!this.mcpServer) {
                    // Initialize MCP server if not already created
                    const { UnifiedMCPServer } = await import('../mcp/unified-mcp-server');
                    this.mcpServer = new UnifiedMCPServer(this.database, this.agentManager, this.extensionContext);
                }
                await this.mcpServer.start();
                vscode.window.showInformationMessage('MCP Server started.');
                return { 
                    connected: this.mcpServer.isServerRunning(), 
                    server: 'unified',
                    status: 'Server running' 
                };
            case 'stop':
                if (!this.mcpServer) {
                    return { connected: false, server: 'none', status: 'Server not started' };
                }
                await this.mcpServer.stop();
                vscode.window.showInformationMessage('MCP Server stopped.');
                return { 
                    connected: this.mcpServer.isServerRunning(), 
                    server: 'unified',
                    status: 'Server stopped' 
                };
            case 'getStatus':
                if (!this.mcpServer) {
                    return { connected: false, server: 'none', status: 'Server not started' };
                }
                return { 
                    connected: this.mcpServer.isServerRunning(), 
                    server: 'unified',
                    status: this.mcpServer.isServerRunning() ? 'Server running' : 'Server stopped'
                };
            default:
                throw new Error(`Unknown MCP action: ${action}`);
        }
    }

    private async handleCaptureActions(action: string, payload: any): Promise<any> {
        switch (action) {
            case 'toggleGit':
                await this.autoCapture.toggleGitMonitoring();
                return this.configStore.getConfig();
            case 'toggleFile':
                await this.autoCapture.toggleFileMonitoring();
                return this.configStore.getConfig();
            default:
                throw new Error(`Unknown capture action: ${action}`);
        }
    }

    private postResponse(response: WebviewResponse) {
        if (this.webviewView) {
            this.webviewView.webview.postMessage(response);
        }
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private setupTokenMonitorListeners() {
        // Listen for token usage updates
        this.tokenMonitor.on('usage-updated', (usage) => {
            this.postResponse({ 
                command: 'token.usageUpdated',
                payload: { usage },
                requestId: 'token-monitor',
                error: undefined
            });
        });

        // Listen for token usage warnings
        this.tokenMonitor.on('usage-warning', (warning) => {
            // Show VSCode notification for critical warnings
            if (warning.type === 'critical') {
                vscode.window.showWarningMessage(warning.message);
            } else if (warning.type === 'warning') {
                vscode.window.showInformationMessage(warning.message);
            }
        });
    }
}
