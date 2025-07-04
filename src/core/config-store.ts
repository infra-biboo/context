import * as vscode from 'vscode';

export interface AppConfig {
    capture: {
        gitCommits: boolean;
        fileChanges: boolean;
        keywords: boolean;
    };
    ui: {
        theme: 'auto' | 'light' | 'dark';
        density: 'compact' | 'normal' | 'spacious';
    };
}

export class ConfigStore {
    private static instance: ConfigStore;
    private config: AppConfig;
    private listeners: Set<(config: AppConfig) => void> = new Set();

    private constructor(private context: vscode.ExtensionContext) {
        this.config = this.getDefaultConfig();
        this.loadConfig();
    }

    static getInstance(context: vscode.ExtensionContext): ConfigStore {
        if (!ConfigStore.instance) {
            ConfigStore.instance = new ConfigStore(context);
        }
        return ConfigStore.instance;
    }

    private getDefaultConfig(): AppConfig {
        return {
            capture: {
                gitCommits: true,
                fileChanges: true,
                keywords: false
            },
            ui: {
                theme: 'auto',
                density: 'normal'
            }
        };
    }

    private loadConfig(): void {
        const stored = this.context.globalState.get<AppConfig>('config');
        if (stored) {
            this.config = { ...this.getDefaultConfig(), ...stored };
        }
    }

    private async saveConfig(): Promise<void> {
        await this.context.globalState.update('config', this.config);
        this.notifyListeners();
    }

    getConfig(): AppConfig {
        return { ...this.config };
    }

    async updateConfig(updates: Partial<AppConfig>): Promise<void> {
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
    }

    subscribe(listener: (config: AppConfig) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config));
    }
}