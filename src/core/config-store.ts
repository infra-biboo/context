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
    collaborationMode: 'individual' | 'collaborative' | 'hierarchical';
    onboardingCompleted?: boolean;
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
            },
            collaborationMode: 'collaborative',
            onboardingCompleted: false
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

    getOnboardingCompleted(): boolean {
        return this.context.globalState.get('onboardingCompleted', false);
    }

    async setOnboardingCompleted(completed: boolean): Promise<void> {
        await this.context.globalState.update('onboardingCompleted', completed);
    }

    subscribe(listener: (config: AppConfig) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    async resetToDefaults(): Promise<void> {
        // Reset to default configuration
        this.config = this.getDefaultConfig();
        
        // Clear all stored preferences
        await this.context.globalState.update('config', undefined);
        await this.context.globalState.update('onboardingCompleted', false);
        
        // Save the default config
        await this.saveConfig();
        
        // Notify all listeners
        this.notifyListeners();
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config));
    }
}