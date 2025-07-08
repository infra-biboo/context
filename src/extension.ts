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
import { UnifiedMCPServer } from './mcp/unified-mcp-server';
import { MCPConfigGenerator } from './mcp/config-generator';
import { Logger } from './utils/logger';
import { SimpleTokenMonitor } from './core/simple-token-monitor';
import { registerTokenCommands } from './commands/token-commands';
import { registerMCPTestCommands } from './commands/mcp-test-commands';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Claude Context Manager: Starting activation...');
    
    try {
        Logger.initialize();
        Logger.info('Claude Context Manager activating...');
        console.log('✅ Logger initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize logger:', error);
        vscode.window.showErrorMessage('Failed to initialize logger');
        return;
    }
    
    // Initialize database with new adapter architecture
    console.log('📦 Creating ContextDatabase instance...');
    let database: ContextDatabase;
    try {
        database = new ContextDatabase(context);
        console.log('✅ ContextDatabase instance created');
    } catch (error) {
        console.error('❌ Failed to create ContextDatabase:', error);
        vscode.window.showErrorMessage('Failed to create database instance');
        return;
    }
    
    console.log('🔄 Initializing database...');
    try {
        await database.initialize();
        Logger.info('Database initialized successfully');
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
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
    
    // Initialize agent manager first
    const agentManager = new AgentManager(database, configStore);
    await agentManager.initialize();
    
    // Check if MCP should be enabled
    const shouldEnableMCP = UnifiedMCPServer.shouldStartMCP();
    Logger.info(`MCP Integration: ${shouldEnableMCP ? 'Enabled' : 'Disabled'}`);
    
    // Initialize MCP server only if enabled
    let mcpServer: UnifiedMCPServer | undefined;
    if (shouldEnableMCP) {
        mcpServer = new UnifiedMCPServer(database, agentManager, context);
        try {
            await mcpServer.start();
            Logger.info('✅ Unified MCP Server started successfully');
        } catch (error) {
            Logger.error('❌ Failed to start MCP Server:', error instanceof Error ? error : new Error(String(error)));
            vscode.window.showWarningMessage(
                'MCP Server failed to start. Context Manager will work in standalone mode.',
                'Settings'
            ).then(selection => {
                if (selection === 'Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'claude-context.enableMCP');
                }
            });
        }
    } else {
        Logger.info('✅ Context Manager running in standalone mode (MCP disabled)');
    }
    
    const mcpConfigGenerator = new MCPConfigGenerator(context.extensionPath);
    
    // Initialize auto-capture system (works independently of MCP)
    const autoCapture = new AutoCapture(contextManager.getDatabase(), context, mcpServer);
    await autoCapture.initialize();
    
    // Initialize simple token monitor
    const tokenMonitor = new SimpleTokenMonitor();
    
    // Register webview provider
    console.log('🖥️ Creating webview provider...');
    let webviewProvider;
    try {
        webviewProvider = new ContextWebviewProvider(
            context.extensionUri,
            database,
            configStore,
            autoCapture,
            agentManager,
            mcpServer,
            mcpConfigGenerator,
            tokenMonitor,
            context
        );
        console.log('✅ Webview provider created successfully');
    } catch (error) {
        console.error('❌ Failed to create webview provider:', error);
        vscode.window.showErrorMessage('Failed to create webview provider');
        return;
    }
    
    console.log('📝 Registering webview provider...');
    try {
        const registration = vscode.window.registerWebviewViewProvider(
            ContextWebviewProvider.viewType,
            webviewProvider
        );
        context.subscriptions.push(registration);
        console.log('✅ Webview provider registered successfully');
    } catch (error) {
        console.error('❌ Failed to register webview provider:', error);
        vscode.window.showWarningMessage('Failed to register webview provider - extension will continue without UI panel');
        // Continue without the webview
    }
    
    // Register commands
    registerCommands(context);
    registerPanelCommands(context);
    registerGitTestCommands(context);
    registerMCPCommands(context);
    registerTokenCommands(context, tokenMonitor);
    registerMCPTestCommands(context);
    
    
    // Add auto-capture, agent manager, database, token monitor, and MCP server to disposables
    context.subscriptions.push(autoCapture);
    context.subscriptions.push(agentManager);
    context.subscriptions.push({
        dispose: async () => {
            if (mcpServer) {
                await mcpServer.stop();
            }
            await database.close();
            tokenMonitor.removeAllListeners();
        }
    });
    
    Logger.info('Claude Context Manager activated successfully');
    console.log('🎉 Claude Context Manager activated successfully!');
    vscode.window.showInformationMessage('Claude Context Manager loaded successfully!');
}

export function deactivate() {
    Logger.info('Claude Context Manager deactivated');
}