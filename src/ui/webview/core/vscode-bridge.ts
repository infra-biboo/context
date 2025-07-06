import type { WebviewApi } from "vscode-webview";
import { store } from './store';
import { DatabaseConfig } from '../../../core/database/types';

// VS Code webview API declaration
declare function acquireVsCodeApi(): WebviewApi<unknown>;

export class VSCodeBridge {
    private static instance: VSCodeBridge;
    private readonly vscode: WebviewApi<unknown>;
    private messageHandlers: Map<string, Function[]> = new Map();

    private constructor() {
        this.vscode = acquireVsCodeApi();
        this.setupGlobalMessageHandler();
    }

    public static getInstance(): VSCodeBridge {
        if (!VSCodeBridge.instance) {
            VSCodeBridge.instance = new VSCodeBridge();
        }
        return VSCodeBridge.instance;
    }

    public initialize() {
        // Register default handlers for store updates
        this.registerHandler('contexts-updated', (message: any) => {
            store.setContexts(message.contexts || []);
        });

        this.registerHandler('agents-updated', (message: any) => {
            store.setAgents(message.agents || []);
        });

        this.registerHandler('stats-updated', (message: any) => {
            store.setStats(message.stats || {});
        });

        this.registerHandler('connection-status', (message: any) => {
            store.setConnectionStatus(message.status || 'disconnected');
        });

        this.registerHandler('database-config-updated', (message: any) => {
            if (message.config && message.config.type) {
                store.setDatabaseConfig(message.config);
            } else {
                console.warn('Received invalid database config:', message.config);
                // Set a default config if none is provided
                store.setDatabaseConfig({
                    type: 'json',
                    json: { path: './context.json', maxContexts: 1000 }
                });
            }
        });

        this.registerHandler('search-results', (message: any) => {
            store.setSearchResults(message.results || []);
            store.setIsLoading(false);
        });

        this.registerHandler('error', (message: any) => {
            store.setErrorMessage(message.message || 'Unknown error');
            store.setIsLoading(false);
        });

        // MCP Server handlers
        this.registerHandler('mcp-server-started', (message: any) => {
            store.setMcpStatus({ connected: true, status: message.message || 'Server started' });
            store.setIsLoading(false);
        });

        this.registerHandler('mcp-server-stopped', (message: any) => {
            store.setMcpStatus({ connected: false, status: message.message || 'Server stopped' });
            store.setIsLoading(false);
        });

        this.registerHandler('mcp-status-updated', (message: any) => {
            if (message.status) {
                store.setMcpStatus(message.status);
            }
            store.setIsLoading(false);
        });

        // Request initial data
        this.requestInitialData();
    }

    public registerHandler(messageType: string, handler: Function) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        const handlers = this.messageHandlers.get(messageType);
        if (handlers) {
            handlers.push(handler);
        }
    }

    public sendMessage(message: any) {
        this.vscode.postMessage(message);
    }

    // Database configuration methods
    public updateDatabaseConfig(config: DatabaseConfig) {
        store.setIsLoading(true);
        this.sendMessage({
            type: 'update-database-config',
            config
        });
    }

    public testDatabaseConnection(config: DatabaseConfig) {
        store.setIsLoading(true);
        this.sendMessage({
            type: 'test-database-connection',
            config
        });
    }

    // Data methods
    public requestInitialData() {
        this.sendMessage({ type: 'request-initial-data' });
    }

    public getContexts() {
        this.sendMessage({ type: 'get-contexts' });
    }

    public addTestContext() {
        this.sendMessage({ type: 'add-test-context' });
    }

    public getConfig() {
        this.sendMessage({ type: 'get-config' });
    }

    public searchContexts(query: string, options?: any) {
        store.setIsLoading(true);
        this.sendMessage({
            type: 'search-contexts',
            query,
            options
        });
    }

    public deleteContext(id: string) {
        this.sendMessage({
            type: 'delete-context',
            id
        });
    }

    public updateContext(contextId: string, updates: any) {
        this.sendMessage({
            type: 'update-context',
            contextId,
            updates
        });
    }

    public deleteMultipleContexts(contextIds: string[]) {
        this.sendMessage({
            type: 'delete-multiple-contexts',
            contextIds
        });
    }

    // Agent methods
    public getAgents() {
        this.sendMessage({ type: 'get-agents' });
    }

    public saveAgent(agent: any) {
        this.sendMessage({
            type: 'save-agent',
            agent
        });
    }

    public deleteAgent(id: string) {
        this.sendMessage({
            type: 'delete-agent',
            id
        });
    }

    public toggleAgent(agentId: string, enabled: boolean) {
        this.sendMessage({
            type: 'toggle-agent',
            agentId,
            enabled
        });
    }

    public setCollaborationMode(mode: string) {
        this.sendMessage({
            type: 'set-collaboration-mode',
            mode
        });
    }

    // Configuration methods
    public toggleGitCapture() {
        this.sendMessage({ type: 'toggle-git-capture' });
    }

    public toggleFileCapture() {
        this.sendMessage({ type: 'toggle-file-capture' });
    }

    // MCP Server methods
    public startMCPServer() {
        store.setIsLoading(true);
        this.sendMessage({
            type: 'start-mcp-server'
        });
    }

    public stopMCPServer() {
        store.setIsLoading(true);
        this.sendMessage({
            type: 'stop-mcp-server'
        });
    }

    public getMCPStatus() {
        this.sendMessage({
            type: 'get-mcp-status'
        });
    }

    public generateMCPConfig() {
        this.sendMessage({ type: 'generate-mcp-config' });
    }

    public testMCPConnection() {
        this.sendMessage({ type: 'test-mcp-connection' });
    }

    private setupGlobalMessageHandler() {
        window.addEventListener('message', (event: MessageEvent) => {
            const message = event.data;
            if (message && message.type) {
                const handlers = this.messageHandlers.get(message.type) || [];
                handlers.forEach(handler => {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error(`Error in handler for ${message.type}:`, error);
                    }
                });
            }
        });
    }
}
