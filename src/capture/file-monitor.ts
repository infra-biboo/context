import * as vscode from 'vscode';
import * as path from 'path';
import { ContextDatabase } from '../core/database';
import { Logger } from '../utils/logger';

export interface FileChangeEvent {
    filePath: string;
    changeType: 'created' | 'modified' | 'deleted';
    timestamp: Date;
}

export class FileMonitor {
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private enabled: boolean = true;
    private recentChanges: Map<string, number> = new Map();
    private debounceTime: number = 3000; // 3 seconds

    constructor(
        private database: ContextDatabase,
        private workspaceRoot: string
    ) {}

    async start(): Promise<void> {
        // Watch for important file changes
        const patterns = [
            '**/*.{ts,js,tsx,jsx,py,java,cpp,c,h}', // Code files
            '**/*.{json,yaml,yml,toml,ini}',        // Config files
            '**/*.{md,txt,rst}',                    // Documentation
            '**/package.json',                      // Package files
            '**/requirements.txt',                  // Python deps
            '**/Cargo.toml',                        // Rust deps
            '**/pom.xml',                          // Java deps
            '**/*.{sql,prisma}',                   // Database files
            '**/docker*',                          // Docker files
            '**/.env*'                             // Environment files
        ];

        // Create watchers for each pattern
        patterns.forEach(pattern => {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(this.workspaceRoot, pattern)
            );

            watcher.onDidCreate(uri => this.handleFileChange(uri, 'created'));
            watcher.onDidChange(uri => this.handleFileChange(uri, 'modified'));
            watcher.onDidDelete(uri => this.handleFileChange(uri, 'deleted'));

            // Store reference to dispose later
            if (!this.fileWatcher) {
                this.fileWatcher = watcher;
            }
        });

        Logger.info('File monitor started for important file types');
    }

    private async handleFileChange(
        uri: vscode.Uri, 
        changeType: 'created' | 'modified' | 'deleted'
    ): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const filePath = uri.fsPath;
        const relativePath = path.relative(this.workspaceRoot, filePath);
        
        // Skip files we don't want to monitor
        if (this.shouldSkipFile(relativePath)) {
            return;
        }

        // Debounce rapid changes to the same file
        const now = Date.now();
        const lastChange = this.recentChanges.get(filePath) || 0;
        
        if (now - lastChange < this.debounceTime) {
            return;
        }
        
        this.recentChanges.set(filePath, now);

        try {
            await this.captureFileChange({
                filePath: relativePath,
                changeType,
                timestamp: new Date()
            });
        } catch (error) {
            Logger.error('Error capturing file change:', error as Error);
        }
    }

    private shouldSkipFile(relativePath: string): boolean {
        const skipPatterns = [
            // Build and output directories
            /node_modules|\.git|dist|build|out|target|\.vscode/,
            // Temporary and cache files
            /\.tmp|\.cache|\.log|\.lock/,
            // OS files
            /\.DS_Store|Thumbs\.db/,
            // IDE files
            /\.idea|\.vscode\/settings\.json/,
            // Very common files that change frequently
            /package-lock\.json|yarn\.lock|\.gitignore/
        ];

        return skipPatterns.some(pattern => pattern.test(relativePath));
    }

    private async captureFileChange(event: FileChangeEvent): Promise<void> {
        const { filePath, changeType, timestamp } = event;
        const fileExtension = path.extname(filePath);
        
        const content = this.generateChangeDescription(filePath, changeType);
        const importance = this.calculateFileImportance(filePath, changeType);
        const tags = this.generateFileTags(filePath, changeType);

        await this.database.addContext({
            projectPath: this.workspaceRoot,
            type: 'code',
            content,
            importance,
            tags
        });

        Logger.info(`File change captured: ${changeType} - ${filePath}`);

        // Show notification for important changes
        if (importance >= 7) {
            vscode.window.showInformationMessage(
                `📁 Important file ${changeType}: ${path.basename(filePath)}`,
                { modal: false }
            );
        }
    }

    private generateChangeDescription(filePath: string, changeType: string): string {
        const fileName = path.basename(filePath);
        const fileDir = path.dirname(filePath);
        
        switch (changeType) {
            case 'created':
                return `New file created: ${fileName} in ${fileDir}`;
            case 'modified':
                return `File modified: ${fileName} in ${fileDir}`;
            case 'deleted':
                return `File deleted: ${fileName} from ${fileDir}`;
            default:
                return `File ${changeType}: ${fileName}`;
        }
    }

    private calculateFileImportance(filePath: string, changeType: string): number {
        const fileName = path.basename(filePath).toLowerCase();
        const extension = path.extname(filePath).toLowerCase();
        
        // Critical configuration files
        const criticalFiles = [
            'package.json', 'cargo.toml', 'requirements.txt', 
            'dockerfile', 'docker-compose.yml', '.env'
        ];
        
        // Important file types
        const importantExtensions = [
            '.ts', '.js', '.tsx', '.jsx', '.py', '.java', 
            '.cpp', '.c', '.h', '.rs', '.go'
        ];
        
        // Configuration extensions
        const configExtensions = [
            '.json', '.yaml', '.yml', '.toml', '.ini', '.config'
        ];

        let baseImportance = 5;

        // Adjust based on file type
        if (criticalFiles.some(file => fileName.includes(file))) {
            baseImportance = 8;
        } else if (importantExtensions.includes(extension)) {
            baseImportance = 6;
        } else if (configExtensions.includes(extension)) {
            baseImportance = 7;
        }

        // Adjust based on change type
        switch (changeType) {
            case 'created':
                baseImportance += 1;
                break;
            case 'deleted':
                baseImportance += 2;
                break;
            case 'modified':
                // No adjustment for modifications
                break;
        }

        return Math.min(10, Math.max(1, baseImportance));
    }

    private generateFileTags(filePath: string, changeType: string): string[] {
        const tags = ['file-change', changeType];
        const extension = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        // Add language tags
        const languageTags: { [key: string]: string } = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript', 
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.rs': 'rust',
            '.go': 'go',
            '.php': 'php',
            '.rb': 'ruby',
            '.cs': 'csharp'
        };

        if (languageTags[extension]) {
            tags.push(languageTags[extension]);
        }

        // Add file type tags
        if (['.json', '.yaml', '.yml', '.toml', '.ini'].includes(extension)) {
            tags.push('config');
        }
        
        if (['.md', '.txt', '.rst'].includes(extension)) {
            tags.push('documentation');
        }
        
        if (fileName.includes('test') || fileName.includes('spec')) {
            tags.push('testing');
        }
        
        if (fileName.includes('docker')) {
            tags.push('docker');
        }
        
        if (fileName.includes('.env')) {
            tags.push('environment');
        }

        return tags;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        Logger.info(`File monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            Logger.info('File monitor disposed');
        }
    }
}