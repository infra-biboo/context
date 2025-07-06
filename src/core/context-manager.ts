import * as vscode from 'vscode';
import { ContextDatabase } from './database';
import { Logger } from '../utils/logger';

export class ContextManager {
    private database: ContextDatabase;

    constructor(private extensionContext: vscode.ExtensionContext) {
        this.database = new ContextDatabase(extensionContext);
    }

    async initialize(): Promise<void> {
        // Database is now initialized in its constructor
        Logger.info('Context Manager initialized successfully');
    }

    async initializeWithDatabase(database: ContextDatabase): Promise<void> {
        this.database = database;
        Logger.info('Context Manager initialized with external database');
    }

    getDatabase(): ContextDatabase {
        return this.database;
    }

    async captureContext(
        type: 'conversation' | 'decision' | 'code' | 'issue',
        content: string,
        importance: number = 5,
        tags: string[] = []
    ): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const projectPath = workspaceFolder?.uri.fsPath || 'unknown';

        const contextId = await this.database.addContext({
            projectPath,
            type,
            content,
            importance,
            tags
        });

        Logger.info(`Context captured: ${type} - ${content.substring(0, 50)}...`);
        return contextId;
    }

    async getRecentContexts(limit: number = 10): Promise<any[]> {
        const contexts = await this.database.getContexts();
        return contexts.slice(0, limit);
    }
}