import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ContextDatabase } from '../core/database';
import { Logger } from '../utils/logger';
import { MCPClient } from '../mcp/mcp-client';
import { MCPServer } from '../mcp/server';
import { ConfigStore } from '../core/config-store';

export class GitMonitor {
    private gitWatcher: vscode.FileSystemWatcher | undefined;
    private enabled: boolean = true;
    private lastCommitTime: number = 0;
    private mcpClient: MCPClient | undefined;

    constructor(
        private database: ContextDatabase,
        private workspaceRoot: string,
        private extensionContext?: any,
        private mcpServer?: MCPServer
    ) {
        if (extensionContext) {
            this.mcpClient = new MCPClient(extensionContext, mcpServer);
        }
    }

    async start(): Promise<void> {
        const gitPath = path.join(this.workspaceRoot, '.git');
        
        if (!fs.existsSync(gitPath)) {
            Logger.info('No git repository found, git monitoring disabled');
            return;
        }

        // Watch for changes in .git directory
        this.gitWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(gitPath, '**/*')
        );

        this.gitWatcher.onDidChange(async (uri) => {
            if (this.shouldProcessGitChange(uri)) {
                await this.handleGitChange(uri);
            }
        });

        this.gitWatcher.onDidCreate(async (uri) => {
            if (this.shouldProcessGitChange(uri)) {
                await this.handleGitChange(uri);
            }
        });

        Logger.info('Git monitor started successfully');
    }

    private shouldProcessGitChange(uri: vscode.Uri): boolean {
        const fileName = path.basename(uri.fsPath);
        
        // Only monitor COMMIT_EDITMSG to avoid duplicates
        // This file is created/modified only when a commit is made
        return fileName === 'COMMIT_EDITMSG' && this.enabled;
    }

    private async handleGitChange(uri: vscode.Uri): Promise<void> {
        // Prevent duplicate processing of the same commit
        const now = Date.now();
        if (now - this.lastCommitTime < 3000) { // Increased to 3 seconds
            return;
        }

        try {
            // Only handle COMMIT_EDITMSG since that's all we're monitoring now
            await this.handleCommitMessage(uri);
        } catch (error) {
            Logger.error('Error handling git change:', error as Error);
        }
    }

    private async handleCommitMessage(uri: vscode.Uri): Promise<void> {
        // Wait a bit for file to be written completely
        setTimeout(async () => {
            try {
                if (!fs.existsSync(uri.fsPath)) {
                    return;
                }

                const commitMessage = fs.readFileSync(uri.fsPath, 'utf-8').trim();
                
                // Filter out empty messages or git comments
                if (!commitMessage || commitMessage.startsWith('#') || commitMessage.length < 3) {
                    return;
                }

                // Extract meaningful part of commit message
                const meaningfulMessage = commitMessage.split('\n')[0].trim();
                
                if (meaningfulMessage) {
                    this.lastCommitTime = Date.now();
                    
                    const importance = this.calculateCommitImportance(meaningfulMessage);
                    const tags = this.extractCommitTags(meaningfulMessage);
                    let content = `Git commit: ${meaningfulMessage}`;

                    // Debug logging
                    Logger.info(`Commit analysis: "${meaningfulMessage}"`);
                    Logger.info(`Calculated importance: ${importance}`);
                    Logger.info(`MCPClient available: ${!!this.mcpClient}`);
                    const shouldEnrich = MCPClient.shouldEnrichContext(importance, meaningfulMessage);
                    Logger.info(`Should enrich: ${shouldEnrich}`);

                    // Check if we should enrich this commit
                    if (this.mcpClient && shouldEnrich) {
                        try {
                            Logger.info(`Enriching commit context with Claude: ${meaningfulMessage}`);
                            const enrichedContent = await this.mcpClient.enrichCommitContext(meaningfulMessage, importance);
                            
                            if (enrichedContent) {
                                content = enrichedContent;
                                tags.push('ai-enriched');
                                
                                // Show special notification for enriched commits
                                const language = this.mcpClient && this.extensionContext ? 
                                    ConfigStore.getInstance(this.extensionContext).getConfig().ui.language : 'en';
                                const notification = language === 'es' ? 
                                    `🤖 Commit enriquecido por Claude: ${meaningfulMessage.substring(0, 40)}...` :
                                    `🤖 Commit enriched by Claude: ${meaningfulMessage.substring(0, 40)}...`;
                                
                                vscode.window.showInformationMessage(notification, { modal: false });
                            }
                        } catch (error) {
                            Logger.error('Failed to enrich commit context:', error as Error);
                            // Fall back to regular capture
                        }
                    }
                    
                    await this.database.addContext({
                        projectPath: this.workspaceRoot,
                        type: 'decision',
                        content,
                        importance,
                        tags
                    });

                    if (!tags.includes('ai-enriched')) {
                        vscode.window.showInformationMessage(
                            `📝 Captured commit: ${meaningfulMessage.substring(0, 50)}${meaningfulMessage.length > 50 ? '...' : ''}`,
                            { modal: false }
                        );
                    }

                    Logger.info(`Git commit captured: ${meaningfulMessage}`);
                }
            } catch (error) {
                Logger.error('Error reading commit message:', error as Error);
            }
        }, 1500);
    }

    private async handleHeadChange(): Promise<void> {
        // Additional logic for tracking branch changes, merges, etc.
        // This could capture information about branch switches or merges
        Logger.debug('Git HEAD changed - potential branch switch or merge');
    }

    private calculateCommitImportance(message: string): number {
        const lowerMessage = message.toLowerCase();
        
        // High importance keywords
        const highImportanceKeywords = [
            'breaking', 'major', 'refactor', 'architecture', 'security', 
            'critical', 'hotfix', 'urgent', 'important'
        ];
        
        // Medium importance keywords
        const mediumImportanceKeywords = [
            'feature', 'add', 'implement', 'update', 'improve', 
            'enhance', 'optimize', 'performance'
        ];
        
        // Low importance keywords
        const lowImportanceKeywords = [
            'fix', 'bug', 'typo', 'comment', 'docs', 'documentation',
            'style', 'format', 'cleanup'
        ];

        if (highImportanceKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 8;
        } else if (mediumImportanceKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 6;
        } else if (lowImportanceKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 4;
        }
        
        return 5; // Default importance
    }

    private extractCommitTags(message: string): string[] {
        const tags = ['git', 'commit'];
        const lowerMessage = message.toLowerCase();
        
        // Add contextual tags based on commit message
        const tagPatterns = [
            { pattern: /feat(ure)?|add|implement/, tag: 'feature' },
            { pattern: /fix|bug|error/, tag: 'bugfix' },
            { pattern: /refactor|restructure/, tag: 'refactor' },
            { pattern: /doc(s|umentation)|readme/, tag: 'documentation' },
            { pattern: /test|spec/, tag: 'testing' },
            { pattern: /style|format|lint/, tag: 'style' },
            { pattern: /performance|optimize|speed/, tag: 'performance' },
            { pattern: /security|auth|permission/, tag: 'security' },
            { pattern: /ui|ux|interface/, tag: 'ui' },
            { pattern: /api|endpoint|service/, tag: 'api' },
            { pattern: /database|db|migration/, tag: 'database' },
            { pattern: /config|setting|env/, tag: 'config' }
        ];

        tagPatterns.forEach(({ pattern, tag }) => {
            if (pattern.test(lowerMessage)) {
                tags.push(tag);
            }
        });

        return tags;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        Logger.info(`Git monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    dispose(): void {
        if (this.gitWatcher) {
            this.gitWatcher.dispose();
            Logger.info('Git monitor disposed');
        }
        if (this.mcpClient) {
            this.mcpClient.disconnect();
        }
    }
}