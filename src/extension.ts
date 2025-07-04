import * as vscode from 'vscode';
import { registerCommands } from './commands/test-command';
import { registerPanelCommands } from './commands/panel-commands';
import { registerGitTestCommands } from './commands/git-test-commands';
import { registerMCPCommands } from './commands/mcp-commands';
import { ContextWebviewProvider } from './ui/webview-provider';
import { ContextManager } from './core/context-manager';
import { ConfigStore } from './core/config-store';
import { AutoCapture } from './capture/auto-capture';
import { AgentManager } from './agents/agent-manager';
import { MCPServer } from './mcp/server';
import { MCPConfigGenerator } from './mcp/config-generator';
import { Logger } from './utils/logger';

export async function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Claude Context Manager activating...');
    
    // Initialize core components
    const contextManager = new ContextManager(context);
    await contextManager.initialize();
    
    const configStore = ConfigStore.getInstance(context);
    Logger.info(`Configuration loaded: ${JSON.stringify(configStore.getConfig().capture)}`);
    
    // Initialize auto-capture system
    const autoCapture = new AutoCapture(contextManager.getDatabase(), context);
    await autoCapture.initialize();
    
    // Initialize agent manager
    const agentManager = new AgentManager(configStore);
    
    // Initialize MCP server (optional - only if needed for external connections)
    const mcpServer = new MCPServer(contextManager.getDatabase(), agentManager);
    const mcpConfigGenerator = new MCPConfigGenerator(context.extensionPath);
    
    // Register webview provider
    const webviewProvider = new ContextWebviewProvider(
        context.extensionUri,
        contextManager.getDatabase(),
        configStore,
        autoCapture,
        agentManager,
        mcpServer,
        mcpConfigGenerator
    );
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ContextWebviewProvider.viewType,
            webviewProvider
        )
    );
    
    // Register commands
    registerCommands(context);
    registerPanelCommands(context);
    registerGitTestCommands(context);
    registerMCPCommands(context);
    
    // Add auto-capture, agent manager, and MCP server to disposables
    context.subscriptions.push(autoCapture);
    context.subscriptions.push(agentManager);
    context.subscriptions.push({
        dispose: () => mcpServer.stop()
    });
    
    Logger.info('Claude Context Manager activated successfully');
}

export function deactivate() {
    Logger.info('Claude Context Manager deactivated');
}