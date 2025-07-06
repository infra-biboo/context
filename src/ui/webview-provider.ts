import * as vscode from 'vscode';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { AutoCapture } from '../capture/auto-capture';
import { AgentManager } from '../agents/agent-manager';
import { MCPServer } from '../mcp/server';
import { MCPConfigGenerator } from '../mcp/config-generator';
import { Logger } from '../utils/logger';
import { ActionDispatcher } from './actions/dispatcher';
import { ContextViewActions } from './actions/context-view-actions';
import { AgentViewActions } from './actions/agent-view-actions';
import { ConfigViewActions } from './actions/config-view-actions';
import { McpViewActions } from './actions/mcp-view-actions';

export class ContextWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';
    private webviewView?: vscode.WebviewView;
    private dispatcher: ActionDispatcher;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase,
        private readonly configStore: ConfigStore,
        private readonly autoCapture: AutoCapture,
        private readonly agentManager: AgentManager,
        private readonly mcpServer: MCPServer,
        private readonly mcpConfigGenerator: MCPConfigGenerator
    ) {
        // Initialize action dispatcher with action handlers
        const contextActions = new ContextViewActions(this.database);
        const agentActions = new AgentViewActions(this.agentManager);
        const configActions = new ConfigViewActions(this.configStore, this.autoCapture);
        const mcpActions = new McpViewActions(this.mcpServer, this.mcpConfigGenerator);
        
        this.dispatcher = new ActionDispatcher(contextActions, agentActions, configActions, mcpActions);
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
            (data) => this.handleMessage(data, webviewView)
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

    private async handleMessage(data: any, _webviewView: vscode.WebviewView) {
        try {
            const result = await this.dispatcher.dispatch(data.type, data);
            
            // Handle different response types and send appropriate messages to webview
            switch (data.type) {
                case 'request-initial-data':
                    // Send all initial data
                    const contexts = await this.dispatcher.dispatch('getContexts', {});
                    const agents = await this.dispatcher.dispatch('getAgents', {});
                    const config = await this.dispatcher.dispatch('getConfig', {});
                    const mcpStatus = await this.dispatcher.dispatch('getMCPStatus', {});
                    
                    // Get database configuration directly from the database
                    const databaseConfig = this.database.getDatabaseConfig();
                    
                    this.postMessageToWebview({ type: 'contexts-updated', contexts });
                    this.postMessageToWebview({ type: 'agents-updated', agents: agents.agents, status: agents.status });
                    this.postMessageToWebview({ type: 'stats-updated', stats: { totalContexts: contexts.length, byType: {}, byProject: {}, adapterType: databaseConfig.type } });
                    this.postMessageToWebview({ type: 'connection-status', status: 'connected' });
                    this.postMessageToWebview({ 
                        type: 'database-config-updated', 
                        config: databaseConfig
                    });
                    break;
                
                case 'update-database-config':
                    // Handle database configuration update
                    this.postMessageToWebview({ type: 'database-config-updated', config: data.config });
                    vscode.window.showInformationMessage('Database configuration updated successfully');
                    break;
                
                case 'test-database-connection':
                    // Test database connection
                    this.postMessageToWebview({ type: 'connection-status', status: 'connected' });
                    vscode.window.showInformationMessage('Database connection test successful');
                    break;
                
                case 'search-contexts':
                    this.postMessageToWebview({ type: 'search-results', results: result, query: data.query });
                    break;
                
                case 'delete-context':
                    // Refresh contexts after deletion
                    const updatedContexts = await this.dispatcher.dispatch('getContexts', {});
                    this.postMessageToWebview({ type: 'contexts-updated', contexts: updatedContexts });
                    break;
                
                case 'save-agent':
                    const updatedAgents = await this.dispatcher.dispatch('getAgents', {});
                    this.postMessageToWebview({ type: 'agents-updated', agents: updatedAgents.agents, status: updatedAgents.status });
                    break;
                
                case 'delete-agent':
                    const agentsAfterDelete = await this.dispatcher.dispatch('getAgents', {});
                    this.postMessageToWebview({ type: 'agents-updated', agents: agentsAfterDelete.agents, status: agentsAfterDelete.status });
                    break;
                
                case 'start-mcp-server':
                    const startResult = await this.dispatcher.dispatch('start-mcp-server', {});
                    this.postMessageToWebview({ 
                        type: 'mcp-server-started', 
                        message: startResult.message,
                        success: startResult.success 
                    });
                    if (startResult.success) {
                        vscode.window.showInformationMessage('MCP Server started successfully');
                    } else {
                        vscode.window.showErrorMessage(`Failed to start MCP Server: ${startResult.message}`);
                    }
                    break;
                
                case 'stop-mcp-server':
                    const stopResult = await this.dispatcher.dispatch('stop-mcp-server', {});
                    this.postMessageToWebview({ 
                        type: 'mcp-server-stopped', 
                        message: stopResult.message,
                        success: stopResult.success 
                    });
                    if (stopResult.success) {
                        vscode.window.showInformationMessage('MCP Server stopped successfully');
                    } else {
                        vscode.window.showErrorMessage(`Failed to stop MCP Server: ${stopResult.message}`);
                    }
                    break;
                
                // Standardized action handlers (kebab-case)
                case 'get-contexts':
                    this.postMessageToWebview({ type: 'contexts-updated', contexts: result });
                    break;
                    
                case 'add-test-context':
                    this.postMessageToWebview({ type: 'refreshData' });
                    break;
                    
                case 'get-config':
                    this.postMessageToWebview({ type: 'configData', config: result.config, status: result.status });
                    break;
                    
                case 'get-agents':
                    this.postMessageToWebview({ type: 'agents-updated', agents: result.agents, status: result.status });
                    break;
                    
                case 'toggle-agent':
                    this.postMessageToWebview({ type: 'agents-updated', agents: result.agents, status: result.status });
                    break;
                    
                case 'set-collaboration-mode':
                    this.postMessageToWebview({ type: 'agentsData', agents: result.agents, status: result.status });
                    vscode.window.showInformationMessage(`Collaboration mode changed to: ${data.mode}`);
                    break;
                    
                case 'update-context':
                case 'delete-multiple-contexts':
                    this.postMessageToWebview({ type: 'refreshData' });
                    break;
                    
                case 'edit-context':
                    this.postMessageToWebview({ type: 'editContextData', context: result });
                    break;
                    
                case 'toggle-git-capture':
                case 'toggle-file-capture':
                    // These actions typically don't need specific responses
                    break;
                    
                case 'generate-mcp-config':
                    vscode.window.showInformationMessage('MCP configuration generated successfully');
                    break;
                    
                case 'test-mcp-connection':
                    this.postMessageToWebview({ type: 'mcpStatus', connected: result });
                    if (result) {
                        vscode.window.showInformationMessage('MCP Server is connected and ready');
                    } else {
                        vscode.window.showWarningMessage('MCP Server is not connected. Try restarting the extension.');
                    }
                    break;
                    
                case 'get-mcp-status':
                    this.postMessageToWebview({ type: 'mcp-status-updated', status: result });
                    break;
            }
        } catch (error) {
            Logger.error('Error handling message:', error as Error);
            
            // Send error to SolidJS app
            this.postMessageToWebview({ 
                type: 'error', 
                message: error instanceof Error ? error.message : 'Unknown error occurred' 
            });
            
            // Show error messages for user-facing actions
            if (data.type === 'generateMCPConfig') {
                vscode.window.showErrorMessage(`Failed to generate MCP config: ${error}`);
            } else if (data.type === 'testMCPConnection' || data.type === 'test-database-connection') {
                this.postMessageToWebview({ type: 'connection-status', status: 'disconnected' });
                vscode.window.showErrorMessage(`Error testing connection: ${error}`);
            } else if (data.type === 'getMCPStatus') {
                this.postMessageToWebview({ type: 'mcpStatus', connected: false });
            }
        }
    }


    private postMessageToWebview(message: any) {
        if (this.webviewView) {
            this.webviewView.webview.postMessage(message);
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
}
