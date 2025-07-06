import * as vscode from 'vscode';
import { GitMonitor } from './git-monitor';
import { FileMonitor } from './file-monitor';
import { ContextDatabase } from '../core/database';
import { ConfigStore } from '../core/config-store';
import { Logger } from '../utils/logger';

export class AutoCapture {
    private gitMonitor: GitMonitor | undefined;
    private fileMonitor: FileMonitor | undefined;
    private configStore: ConfigStore;
    private disposables: vscode.Disposable[] = [];

    constructor(
        private database: ContextDatabase,
        private extensionContext: vscode.ExtensionContext
    ) {
        this.configStore = ConfigStore.getInstance(extensionContext);
        this.setupConfigListener();
    }

    async initialize(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            Logger.info('No workspace folder found, auto-capture disabled');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Initialize monitors
        this.gitMonitor = new GitMonitor(this.database, workspaceRoot, this.extensionContext.extensionPath, this.extensionContext);
        this.fileMonitor = new FileMonitor(this.database, workspaceRoot);

        // Start monitors based on configuration
        await this.updateMonitorsFromConfig();

        Logger.info('Auto-capture system initialized');
    }

    private setupConfigListener(): void {
        const unsubscribe = this.configStore.subscribe(async (config) => {
            await this.updateMonitorsFromConfig();
        });
        
        this.disposables.push({
            dispose: unsubscribe
        });
    }

    private async updateMonitorsFromConfig(): Promise<void> {
        const config = this.configStore.getConfig();

        if (this.gitMonitor) {
            if (config.capture.gitCommits) {
                await this.gitMonitor.start();
                this.gitMonitor.setEnabled(true);
            } else {
                this.gitMonitor.setEnabled(false);
            }
        }

        if (this.fileMonitor) {
            if (config.capture.fileChanges) {
                await this.fileMonitor.start();
                this.fileMonitor.setEnabled(true);
            } else {
                this.fileMonitor.setEnabled(false);
            }
        }

        Logger.info(`Auto-capture updated: Git=${config.capture.gitCommits}, Files=${config.capture.fileChanges}`);
    }

    async captureManualContext(
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
            tags: [...tags, 'manual']
        });

        Logger.info(`Manual context captured: ${type} - ${content.substring(0, 50)}...`);
        
        vscode.window.showInformationMessage(
            `📝 Context captured: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`,
            { modal: false }
        );

        return contextId;
    }

    getStatus(): {
        gitMonitoring: boolean;
        fileMonitoring: boolean;
        workspaceActive: boolean;
    } {
        return {
            gitMonitoring: this.gitMonitor?.isEnabled() || false,
            fileMonitoring: this.fileMonitor?.isEnabled() || false,
            workspaceActive: (vscode.workspace.workspaceFolders?.length || 0) > 0
        };
    }

    async toggleGitMonitoring(): Promise<void> {
        const config = this.configStore.getConfig();
        await this.configStore.updateConfig({
            capture: {
                ...config.capture,
                gitCommits: !config.capture.gitCommits
            }
        });
    }

    async toggleFileMonitoring(): Promise<void> {
        const config = this.configStore.getConfig();
        await this.configStore.updateConfig({
            capture: {
                ...config.capture,
                fileChanges: !config.capture.fileChanges
            }
        });
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.gitMonitor?.dispose();
        this.fileMonitor?.dispose();
        Logger.info('Auto-capture system disposed');
    }
}