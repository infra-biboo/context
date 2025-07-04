import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ContextDatabase } from '../core/database';
import { Logger } from '../utils/logger';

export class GitMonitor {
    private gitWatcher: vscode.FileSystemWatcher | undefined;
    private enabled: boolean = true;
    private lastCommitTime: number = 0;

    constructor(
        private database: ContextDatabase,
        private workspaceRoot: string
    ) {}

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
        
        // Monitor specific git files that indicate commits
        const monitoredFiles = [
            'COMMIT_EDITMSG',
            'ORIG_HEAD',
            'HEAD'
        ];
        
        return monitoredFiles.includes(fileName) && this.enabled;
    }

    private async handleGitChange(uri: vscode.Uri): Promise<void> {
        const fileName = path.basename(uri.fsPath);
        
        // Prevent duplicate processing of the same commit
        const now = Date.now();
        if (now - this.lastCommitTime < 2000) {
            return;
        }

        try {
            switch (fileName) {
                case 'COMMIT_EDITMSG':
                    await this.handleCommitMessage(uri);
                    break;
                case 'HEAD':
                case 'ORIG_HEAD':
                    await this.handleHeadChange();
                    break;
            }
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
                    
                    await this.database.addContext({
                        projectPath: this.workspaceRoot,
                        type: 'decision',
                        content: `Git commit: ${meaningfulMessage}`,
                        importance: this.calculateCommitImportance(meaningfulMessage),
                        tags: this.extractCommitTags(meaningfulMessage)
                    });

                    vscode.window.showInformationMessage(
                        `📝 Captured commit: ${meaningfulMessage.substring(0, 50)}${meaningfulMessage.length > 50 ? '...' : ''}`,
                        { modal: false }
                    );

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
    }
}