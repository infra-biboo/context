import * as vscode from 'vscode';
import * as path from 'path';
import { DatabaseAdapter } from './database/database-adapter';
import { DatabaseFactory } from './database/database-factory';
import { DatabaseConfig, SearchOptions, VectorSearchOptions } from './database/types';
import { Logger } from '../utils/logger';

// Re-export types for compatibility
export { ContextEntry, DatabaseAgent } from './database/types';
export { SearchOptions, VectorSearchOptions, DatabaseConfig } from './database/types';

export class ContextDatabase {
    private adapter: DatabaseAdapter;
    private isInitialized: boolean = false;
    private currentConfig: DatabaseConfig;

    constructor(
        private extensionContext: vscode.ExtensionContext,
        config?: DatabaseConfig
    ) {
        // Use provided config or create default SQLite configuration
        const dbConfig = config || this.createDefaultConfig();
        this.currentConfig = dbConfig;
        
        try {
            this.adapter = DatabaseFactory.create(dbConfig);
            Logger.info(`ContextDatabase created with adapter: ${dbConfig.type}`);
        } catch (error) {
            Logger.error('Failed to create database adapter:', error as Error);
            // Fallback to default JSON
            const fallbackConfig = this.createDefaultConfig();
            this.currentConfig = fallbackConfig;
            this.adapter = DatabaseFactory.create(fallbackConfig);
            Logger.info('Using fallback JSON configuration');
        }
    }

    /**
     * Initialize the database connection and schema
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            await this.ensureStorageDir();
            await this.adapter.connect();
            this.isInitialized = true;
            Logger.info('ContextDatabase initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize ContextDatabase:', error as Error);
            throw error;
        }
    }

    /**
     * Initialize with existing database (for backward compatibility)
     */
    async initializeWithDatabase(legacyDatabase: any): Promise<void> {
        Logger.warn('initializeWithDatabase is deprecated, use initialize() instead');
        await this.initialize();
    }

    /**
     * Check if database is connected and healthy
     */
    async isHealthy(): Promise<boolean> {
        if (!this.isInitialized) {
            return false;
        }
        
        return await this.adapter.healthCheck();
    }

    /**
     * Get database adapter instance (for advanced usage)
     */
    getAdapter(): DatabaseAdapter {
        return this.adapter;
    }

    /**
     * Get underlying database instance (for backward compatibility)
     */
    getDatabase(): DatabaseAdapter {
        Logger.warn('getDatabase() is deprecated, use getAdapter() instead');
        return this.adapter;
    }

    /**
     * Get current database configuration
     */
    getDatabaseConfig(): DatabaseConfig {
        return this.currentConfig;
    }

    // === Context Operations ===

    async addContext(entry: Omit<import('./database/types').ContextEntry, 'id' | 'timestamp'>): Promise<string> {
        this.ensureInitialized();
        return await this.adapter.addContext(entry);
    }

    async getContexts(projectPath?: string): Promise<import('./database/types').ContextEntry[]> {
        this.ensureInitialized();
        const options: SearchOptions = projectPath ? { projectPath } : {};
        return await this.adapter.getContexts(options);
    }

    async getContextById(id: string): Promise<import('./database/types').ContextEntry | undefined> {
        this.ensureInitialized();
        return await this.adapter.getContextById(id);
    }

    async updateContext(id: string, updates: Partial<Omit<import('./database/types').ContextEntry, 'id' | 'timestamp'>>): Promise<void> {
        this.ensureInitialized();
        return await this.adapter.updateContext(id, updates);
    }

    async deleteContext(id: string): Promise<void> {
        this.ensureInitialized();
        return await this.adapter.deleteContext(id);
    }

    async searchContexts(query: string, options: SearchOptions = {}): Promise<import('./database/types').ContextEntry[]> {
        this.ensureInitialized();
        return await this.adapter.searchContexts(query, options);
    }

    /**
     * Search for similar contexts using vector embeddings (if supported)
     */
    async searchSimilar(embedding: number[], options?: VectorSearchOptions): Promise<import('./database/types').ContextEntry[]> {
        this.ensureInitialized();
        
        if (!this.adapter.searchSimilar) {
            throw new Error('Vector search not supported by current database adapter');
        }
        
        return await this.adapter.searchSimilar(embedding, options);
    }

    async getContextCount(options: SearchOptions = {}): Promise<number> {
        this.ensureInitialized();
        return await this.adapter.getContextCount(options);
    }

    // === Agent Operations ===

    async addAgent(agentData: Omit<import('./database/types').DatabaseAgent, 'id'>): Promise<import('./database/types').DatabaseAgent> {
        this.ensureInitialized();
        return await this.adapter.addAgent(agentData);
    }

    async getAllAgents(): Promise<import('./database/types').DatabaseAgent[]> {
        this.ensureInitialized();
        return await this.adapter.getAllAgents();
    }

    async getAgentById(id: string): Promise<import('./database/types').DatabaseAgent | undefined> {
        this.ensureInitialized();
        return await this.adapter.getAgentById(id);
    }

    async updateAgent(id: string, updates: Partial<Omit<import('./database/types').DatabaseAgent, 'id'>>): Promise<void> {
        this.ensureInitialized();
        return await this.adapter.updateAgent(id, updates);
    }

    async deleteAgent(id: string): Promise<void> {
        this.ensureInitialized();
        return await this.adapter.deleteAgent(id);
    }

    async populateStandardAgents(): Promise<void> {
        this.ensureInitialized();
        
        try {
            const standardAgents: import('./database/types').DatabaseAgent[] = [
                {
                    id: 'architect',
                    name: 'Architect',
                    description: 'System design and architecture decisions',
                    emoji: '🏗️',
                    specializations: ['System Design', 'Architecture Patterns', 'Scalability', 'Technical Decisions'],
                    color: '#FF6B35',
                    enabled: true,
                    isCustom: false
                },
                {
                    id: 'backend',
                    name: 'Backend',
                    description: 'Server-side development and APIs',
                    emoji: '⚙️',
                    specializations: ['REST APIs', 'Database Design', 'Authentication', 'Performance'],
                    color: '#4ECDC4',
                    enabled: true,
                    isCustom: false
                },
                {
                    id: 'frontend',
                    name: 'Frontend',
                    description: 'User interface and experience',
                    emoji: '🎨',
                    specializations: ['React/Vue', 'UI/UX Design', 'Responsive Design', 'Accessibility'],
                    color: '#45B7D1',
                    enabled: true,
                    isCustom: false
                }
            ];

            for (const agentData of standardAgents) {
                try {
                    // Check if agent already exists
                    const existing = await this.getAgentById(agentData.id);
                    if (!existing) {
                        // Use adapter directly to insert with predefined ID
                        await this.adapter.addAgentWithId(agentData);
                        Logger.info(`Standard agent '${agentData.name}' added with ID: ${agentData.id}`);
                    } else {
                        Logger.info(`Standard agent '${agentData.name}' already exists`);
                    }
                } catch (error) {
                    Logger.error(`Error adding standard agent '${agentData.name}': ${error}`);
                }
            }

            Logger.info('Standard agents populated successfully');
        } catch (error) {
            Logger.error('Failed to populate standard agents:', error as Error);
            throw error;
        }
    }

    // === Utility Operations ===

    async getStats(): Promise<import('./database/types').DatabaseStats> {
        this.ensureInitialized();
        return await this.adapter.getStats();
    }

    /**
     * Export all data (if supported by adapter)
     */
    async exportData(): Promise<any> {
        this.ensureInitialized();
        
        if (!this.adapter.exportData) {
            throw new Error('Data export not supported by current database adapter');
        }
        
        return await this.adapter.exportData();
    }

    /**
     * Import data (if supported by adapter)
     */
    async importData(data: any): Promise<void> {
        this.ensureInitialized();
        
        if (!this.adapter.importData) {
            throw new Error('Data import not supported by current database adapter');
        }
        
        return await this.adapter.importData(data);
    }

    /**
     * Sync with another adapter (for hybrid setups)
     */
    async syncWith(otherAdapter: DatabaseAdapter): Promise<import('./database/types').SyncResult> {
        this.ensureInitialized();
        
        if (!this.adapter.syncWith) {
            throw new Error('Sync not supported by current database adapter');
        }
        
        return await this.adapter.syncWith(otherAdapter);
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        if (this.isInitialized) {
            await this.adapter.disconnect();
            this.isInitialized = false;
            Logger.info('ContextDatabase connection closed');
        }
    }

    // === Private Methods ===

    private createDefaultConfig(): DatabaseConfig {
        const dbPath = path.join(
            this.extensionContext.globalStorageUri.fsPath,
            'context.json'
        );

        return {
            type: 'json',
            json: { path: dbPath, maxContexts: 1000 }
        };
    }

    private async ensureStorageDir(): Promise<void> {
        const fs = await import('fs/promises');
        try {
            await fs.mkdir(
                this.extensionContext.globalStorageUri.fsPath,
                { recursive: true }
            );
        } catch (error) {
            Logger.error('Failed to create storage directory:', error as Error);
            throw error;
        }
    }

    private ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
    }

    // === Static Factory Methods ===

    /**
     * Create ContextDatabase with specific configuration
     */
    static create(extensionContext: vscode.ExtensionContext, config: DatabaseConfig): ContextDatabase {
        return new ContextDatabase(extensionContext, config);
    }

    /**
     * Create ContextDatabase from environment variables
     */
    static createFromEnvironment(extensionContext: vscode.ExtensionContext): ContextDatabase {
        try {
            const config = DatabaseFactory.getConfigFromEnvironment();
            return new ContextDatabase(extensionContext, config);
        } catch (error) {
            Logger.warn('Failed to create from environment, using default config:', error as Error);
            return new ContextDatabase(extensionContext);
        }
    }

    /**
     * Create ContextDatabase with recommended configuration for scenario
     */
    static createForScenario(
        extensionContext: vscode.ExtensionContext, 
        scenario: 'development' | 'production' | 'team'
    ): ContextDatabase {
        const config = DatabaseFactory.getRecommendedConfig(scenario);
        
        // Adjust path for VS Code extension context
        if (config.type === 'json' && config.json) {
            config.json.path = path.join(
                extensionContext.globalStorageUri.fsPath,
                `${scenario}-context.json`
            );
        }
        
        return new ContextDatabase(extensionContext, config);
    }
}
