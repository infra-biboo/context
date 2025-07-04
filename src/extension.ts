import * as vscode from 'vscode';
import { registerCommands } from './commands/test-command';
import { registerPanelCommands } from './commands/panel-commands';
import { registerGitTestCommands } from './commands/git-test-commands';
import { ContextWebviewProvider } from './ui/webview-provider';
import { ContextManager } from './core/context-manager';
import { ConfigStore } from './core/config-store';
import { AutoCapture } from './capture/auto-capture';
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
    
    // Register webview provider
    const webviewProvider = new ContextWebviewProvider(
        context.extensionUri,
        contextManager.getDatabase(),
        configStore,
        autoCapture
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
    
    // Add auto-capture to disposables
    context.subscriptions.push(autoCapture);
    
    Logger.info('Claude Context Manager activated successfully');
}

export function deactivate() {
    Logger.info('Claude Context Manager deactivated');
}