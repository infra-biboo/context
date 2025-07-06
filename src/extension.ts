import * as vscode from 'vscode';
import { registerCommands } from './commands/test-command';
import { registerPanelCommands } from './commands/panel-commands';
import { registerGitTestCommands } from './commands/git-test-commands';
import { registerMCPCommands } from './commands/mcp-commands';
import { ContextWebviewProvider } from './ui/webview-provider';
import { ContextManager } from './core/context-manager';
import { ContextDatabase } from './core/database';
import { ConfigStore } from './core/config-store';
import { AutoCapture } from './capture/auto-capture';
import { AgentManager } from './agents/agent-manager';
import { MCPServer } from './mcp/server';
import { MCPConfigGenerator } from './mcp/config-generator';
import { Logger } from './utils/logger';
import { SimpleTokenMonitor } from './core/simple-token-monitor';
import { registerTokenCommands } from './commands/token-commands';

export async function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Claude Context Manager activating...');
    
    // Initialize database with new adapter architecture
    const database = new ContextDatabase(context);
    
    try {
        await database.initialize();
        Logger.info('Database initialized successfully');
    } catch (error) {
        Logger.error('Database initialization failed:', error as Error);
        vscode.window.showErrorMessage(
            'Failed to initialize database. Some features may be unavailable.'
        );
        return;
    }
    
    // Initialize core components with new database
    const contextManager = new ContextManager(context);
    await contextManager.initializeWithDatabase(database);
    
    const configStore = ConfigStore.getInstance(context);
    Logger.info(`Configuration loaded: ${JSON.stringify(configStore.getConfig().capture)}`);
    
    // Initialize auto-capture system
    const autoCapture = new AutoCapture(contextManager.getDatabase(), context);
    await autoCapture.initialize();
    
    // Initialize agent manager
    const agentManager = new AgentManager(database, configStore);
    await agentManager.initialize();
    
    // Initialize simple token monitor
    const tokenMonitor = new SimpleTokenMonitor();
    
    // Initialize MCP server with shared database (unified data source)
    const mcpServer = new MCPServer(database, agentManager);
    const mcpConfigGenerator = new MCPConfigGenerator(context.extensionPath);
    
    // Start MCP server
    try {
        await mcpServer.start();
        Logger.info('MCP Server started successfully');
    } catch (error) {
        Logger.error('Failed to start MCP Server:', error instanceof Error ? error : new Error(String(error)));
    }
    
    // Register webview provider
    const webviewProvider = new ContextWebviewProvider(
        context.extensionUri,
        database,
        configStore,
        autoCapture,
        agentManager,
        mcpServer,
        mcpConfigGenerator,
        tokenMonitor
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
    registerTokenCommands(context, tokenMonitor);
    
    // Add auto-capture, agent manager, database, token monitor, and MCP server to disposables
    context.subscriptions.push(autoCapture);
    context.subscriptions.push(agentManager);
    context.subscriptions.push({
        dispose: async () => {
            mcpServer.stop();
            await database.close();
            tokenMonitor.removeAllListeners();
        }
    });
    
    Logger.info('Claude Context Manager activated successfully');
}

export function deactivate() {
    Logger.info('Claude Context Manager deactivated');
}

