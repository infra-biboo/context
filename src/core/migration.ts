import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ContextDatabase, ContextEntry } from './database';
import { Logger } from '../utils/logger';

interface LegacyContextEntry {
    id: string;
    projectPath: string;
    type: 'conversation' | 'decision' | 'code' | 'issue';
    content: string;
    timestamp: string | Date;
    importance: number;
    tags: string[];
}

export class DatabaseMigration {
    private legacyDbPath: string;
    private migrationKey = 'contextDatabase.migrationCompleted';

    constructor(private extensionContext: vscode.ExtensionContext) {
        this.legacyDbPath = path.join(
            extensionContext.globalStorageUri.fsPath,
            'contexts.json'
        );
    }

    /**
     * Check if migration is needed and execute it
     */
    async runMigrationIfNeeded(newDatabase: ContextDatabase): Promise<void> {
        try {
            // Check if migration already completed
            const migrationCompleted = this.extensionContext.globalState.get(this.migrationKey, false);
            if (migrationCompleted) {
                Logger.info('Database migration already completed, skipping');
                return;
            }

            // Check if legacy database exists
            const legacyExists = await this.legacyDatabaseExists();
            if (!legacyExists) {
                Logger.info('No legacy database found, marking migration as completed');
                await this.markMigrationCompleted();
                return;
            }

            Logger.info('Starting database migration from JSON to SQLite...');
            await this.performMigration(newDatabase);
            
            // Mark migration as completed
            await this.markMigrationCompleted();
            
            // Optionally backup the old file
            await this.backupLegacyDatabase();
            
            Logger.info('Database migration completed successfully');
        } catch (error) {
            Logger.error('Database migration failed:', error);
            throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Perform the actual migration
     */
    private async performMigration(newDatabase: ContextDatabase): Promise<void> {
        // Read legacy data
        const legacyData = await this.readLegacyDatabase();
        if (legacyData.length === 0) {
            Logger.info('Legacy database is empty, nothing to migrate');
            return;
        }

        Logger.info(`Migrating ${legacyData.length} context entries...`);
        
        let successCount = 0;
        let errorCount = 0;

        // Migrate each entry
        for (const legacyEntry of legacyData) {
            try {
                // Convert legacy entry to new format
                const contextEntry = this.convertLegacyEntry(legacyEntry);
                
                // Add to new database (we'll use a custom insert to preserve ID and timestamp)
                await this.insertMigratedEntry(newDatabase, contextEntry);
                successCount++;
                
                if (successCount % 100 === 0) {
                    Logger.info(`Migration progress: ${successCount}/${legacyData.length}`);
                }
            } catch (error) {
                errorCount++;
                Logger.error(`Failed to migrate entry ${legacyEntry.id}:`, error);
            }
        }

        Logger.info(`Migration completed: ${successCount} successful, ${errorCount} errors`);
        
        if (errorCount > 0) {
            Logger.warn(`${errorCount} entries failed to migrate. Check logs for details.`);
        }
    }

    /**
     * Check if legacy database file exists
     */
    private async legacyDatabaseExists(): Promise<boolean> {
        try {
            await fs.access(this.legacyDbPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Read and parse legacy JSON database
     */
    private async readLegacyDatabase(): Promise<LegacyContextEntry[]> {
        try {
            const data = await fs.readFile(this.legacyDbPath, 'utf-8');
            const entries = JSON.parse(data);
            
            if (!Array.isArray(entries)) {
                throw new Error('Legacy database format is invalid');
            }
            
            return entries;
        } catch (error) {
            Logger.error('Failed to read legacy database:', error);
            throw error;
        }
    }

    /**
     * Convert legacy entry to new format
     */
    private convertLegacyEntry(legacyEntry: LegacyContextEntry): ContextEntry {
        return {
            id: legacyEntry.id,
            projectPath: legacyEntry.projectPath,
            type: legacyEntry.type,
            content: legacyEntry.content,
            timestamp: new Date(legacyEntry.timestamp),
            importance: legacyEntry.importance,
            tags: Array.isArray(legacyEntry.tags) ? legacyEntry.tags : []
        };
    }

    /**
     * Insert migrated entry preserving original ID and timestamp
     */
    private async insertMigratedEntry(database: ContextDatabase, entry: ContextEntry): Promise<void> {
        const adapter = database.getAdapter();
        if (!adapter.addMigratedContext) {
            throw new Error('The current database adapter does not support migration.');
        }
        await adapter.addMigratedContext(entry);
    }

    /**
     * Mark migration as completed
     */
    private async markMigrationCompleted(): Promise<void> {
        await this.extensionContext.globalState.update(this.migrationKey, true);
    }

    /**
     * Backup legacy database file
     */
    private async backupLegacyDatabase(): Promise<void> {
        try {
            const backupPath = this.legacyDbPath + '.backup';
            await fs.copyFile(this.legacyDbPath, backupPath);
            Logger.info(`Legacy database backed up to: ${backupPath}`);
        } catch (error) {
            Logger.warn('Failed to backup legacy database:', error);
        }
    }

    /**
     * Get migration status
     */
    getMigrationStatus(): {
        completed: boolean;
        legacyDbExists: boolean;
    } {
        const completed = this.extensionContext.globalState.get(this.migrationKey, false);
        return {
            completed,
            legacyDbExists: false // We'll check this async if needed
        };
    }

    /**
     * Reset migration state (for testing purposes)
     */
    async resetMigrationState(): Promise<void> {
        await this.extensionContext.globalState.update(this.migrationKey, false);
        Logger.info('Migration state reset');
    }

    /**
     * Force migration (for testing or manual execution)
     */
    async forceMigration(newDatabase: ContextDatabase): Promise<void> {
        Logger.info('Forcing database migration...');
        await this.resetMigrationState();
        await this.runMigrationIfNeeded(newDatabase);
    }

    /**
     * Validate agents migration
     */
    async validateAgentsMigration(database: ContextDatabase): Promise<{ success: boolean; message: string }> {
        try {
            Logger.info('Validating agents migration...');

            // Check if agents table exists and has data
            const agents = await database.getAllAgents();
            
            if (agents.length === 0) {
                return {
                    success: false,
                    message: 'No agents found in database. Migration may have failed.'
                };
            }

            // Verify standard agents exist
            const standardAgents = agents.filter(agent => !agent.isCustom);
            const expectedStandardAgents = ['Architect', 'Backend', 'Frontend'];
            
            const missingAgents = expectedStandardAgents.filter(expected => 
                !standardAgents.some(agent => agent.name === expected)
            );

            if (missingAgents.length > 0) {
                return {
                    success: false,
                    message: `Missing standard agents: ${missingAgents.join(', ')}`
                };
            }

            // Check that agents have required fields
            for (const agent of agents) {
                if (!agent.id || !agent.name || !agent.description || !agent.specializations) {
                    return {
                        success: false,
                        message: `Agent ${agent.name || 'unknown'} is missing required fields`
                    };
                }
            }

            Logger.info(`Agents migration validation successful. Found ${agents.length} agents (${standardAgents.length} standard, ${agents.length - standardAgents.length} custom)`);
            
            return {
                success: true,
                message: `Agents migration successful. Database contains ${agents.length} agents.`
            };

        } catch (error) {
            Logger.error('Agents migration validation failed:', error as Error);
            return {
                success: false,
                message: `Agents migration validation failed: ${error}`
            };
        }
    }
}