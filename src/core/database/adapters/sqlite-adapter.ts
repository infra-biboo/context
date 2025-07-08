
// import * as sqlite3 from '@vscode/sqlite3';
// Dynamic import to handle different platforms and paths
let sqlite3: any;
import * as path from 'path';
import * as fs from 'fs/promises';
import { BaseDatabaseAdapter } from '../database-adapter';
import { ContextEntry, DatabaseAgent, SearchOptions, DatabaseStats, DatabaseConfig } from '../types';
import { Logger } from '../../../utils/logger';

interface ContextRow {
    id: string;
    projectPath: string;
    type: string;
    content: string;
    timestamp: string;
    importance: number;
    tags: string;
}

interface AgentRow {
    id: string;
    name: string;
    description: string;
    emoji: string | null;
    specializations: string;
    color: string | null;
    enabled: number;
    isCustom: number;
    prompt: string | null;
}

export class SQLiteAdapter extends BaseDatabaseAdapter {
    private db: any | null = null;
    private config: DatabaseConfig['sqlite'];

    constructor(config: DatabaseConfig['sqlite']) {
        super();
        if (!config?.path) {
            throw new Error('SQLite database path is required');
        }
        this.config = config;
    }

    private async loadSQLite3(): Promise<any> {
        const os = require('os');
        const vscode = require('vscode');
        
        const platform = os.platform();
        const arch = os.arch();
        
        // Determine binary name based on platform
        let binaryName;
        if (platform === 'win32') {
            binaryName = 'vscode-sqlite3-win32-x64.node';
        } else if (platform === 'darwin') {
            binaryName = arch === 'arm64' ? 'vscode-sqlite3-darwin-arm64.node' : 'vscode-sqlite3-darwin-x64.node';
        } else {
            binaryName = 'vscode-sqlite3-linux-x64.node';
        }
        
        Logger.info(`Platform: ${platform}, Architecture: ${arch}, Binary: ${binaryName}`);
        
        // Strategy 1: Try to load from extension's dist directory
        try {
            const extensionPath = vscode.extensions.getExtension('claude-dev.claude-context-manager')?.extensionPath;
            if (extensionPath) {
                Logger.info(`Extension path found: ${extensionPath}`);
                
                // Try CI binaries directory first (primary for packaged extensions)
                const binariesPath = path.join(extensionPath, 'dist', 'binaries', binaryName);
                Logger.info(`Trying CI binaries directory: ${binariesPath}`);
                
                if (await fs.access(binariesPath).then(() => true).catch(() => false)) {
                    const sqlite3Module = eval('require')(binariesPath);
                    Logger.info('✅ Successfully loaded SQLite3 binary from CI binaries directory');
                    return sqlite3Module;
                }
                
                // Try platform-specific binary in dist root (development fallback)
                const binaryPath = path.join(extensionPath, 'dist', binaryName);
                Logger.info(`Trying to load SQLite3 binary from: ${binaryPath}`);
                
                if (await fs.access(binaryPath).then(() => true).catch(() => false)) {
                    const sqlite3Module = eval('require')(binaryPath);
                    Logger.info('✅ Successfully loaded platform-specific SQLite3 binary');
                    return sqlite3Module;
                }
                
                // Try fallback universal binary
                const fallbackPath = path.join(extensionPath, 'dist', 'binaries', 'vscode-sqlite3.node');
                Logger.info(`Trying fallback SQLite3 binary from: ${fallbackPath}`);
                
                if (await fs.access(fallbackPath).then(() => true).catch(() => false)) {
                    const sqlite3Module = eval('require')(fallbackPath);
                    Logger.info('✅ Successfully loaded fallback SQLite3 binary');
                    return sqlite3Module;
                }
            } else {
                Logger.warn('Extension path not found from vscode.extensions.getExtension');
            }
        } catch (error) {
            Logger.error('Strategy 1 failed:', error as Error);
        }
        
        // Strategy 2: Try to load from bundled node_modules (eval to avoid webpack bundling)
        try {
            Logger.info('Trying to load SQLite3 from bundled node_modules');
            const sqlite3Module = eval('require')('@vscode/sqlite3');
            Logger.info('✅ Successfully loaded SQLite3 from bundled module');
            return sqlite3Module;
        } catch (error) {
            Logger.error('Strategy 2 failed:', error as Error);
        }
        
        // Strategy 3: Try relative paths from current working directory
        try {
            const cwd = process.cwd();
            Logger.info(`Current working directory: ${cwd}`);
            
            const relativeBinaryPath = path.join(cwd, 'dist', binaryName);
            Logger.info(`Trying relative binary path: ${relativeBinaryPath}`);
            
            if (await fs.access(relativeBinaryPath).then(() => true).catch(() => false)) {
                const sqlite3Module = eval('require')(relativeBinaryPath);
                Logger.info('✅ Successfully loaded SQLite3 binary from relative path');
                return sqlite3Module;
            }
        } catch (error) {
            Logger.error('Strategy 3 failed:', error as Error);
        }
        
        // Final failure
        const errorMessage = `Failed to load SQLite3 module. No binary found for platform: ${platform}, arch: ${arch}`;
        Logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    async connect(): Promise<void> {
        if (this.isConnectedFlag) {
            return;
        }
        try {
            // Load SQLite3 dynamically
            if (!sqlite3) {
                sqlite3 = await this.loadSQLite3();
            }
            
            const dbPath = this.config!.path;
            await fs.mkdir(path.dirname(dbPath), { recursive: true });
            
            this.db = new sqlite3.Database(dbPath);
            await this.initializeSchema();
            
            this.isConnectedFlag = true;
            Logger.info(`SQLiteAdapter connected successfully to: ${dbPath}`);
        } catch (error) {
            Logger.error('Failed to connect SQLiteAdapter:', error as Error);
            this.isConnectedFlag = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err: any) => {
                    if (err) {
                        Logger.error('Failed to disconnect SQLiteAdapter:', err);
                        reject(err);
                    } else {
                        this.db = null;
                        this.isConnectedFlag = false;
                        Logger.info('SQLiteAdapter disconnected');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    private async initializeSchema(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db!.exec(`
                CREATE TABLE IF NOT EXISTS contexts (
                    id TEXT PRIMARY KEY,
                    projectPath TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    importance INTEGER NOT NULL DEFAULT 5,
                    tags TEXT
                );
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT NOT NULL,
                    emoji TEXT,
                    specializations TEXT NOT NULL,
                    color TEXT,
                    enabled INTEGER NOT NULL DEFAULT 1,
                    isCustom INTEGER NOT NULL DEFAULT 0,
                    prompt TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_contexts_timestamp ON contexts(timestamp);
                CREATE INDEX IF NOT EXISTS idx_contexts_project_path ON contexts(projectPath);
            `, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
        const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const timestamp = new Date().toISOString();
        
        return new Promise((resolve, reject) => {
            this.db!.run(
                `INSERT INTO contexts (id, projectPath, type, content, timestamp, importance, tags)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, entry.projectPath, entry.type, entry.content, timestamp, entry.importance, JSON.stringify(entry.tags)],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
    }

    async addMigratedContext(entry: ContextEntry): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db!.run(
                `INSERT INTO contexts (id, projectPath, type, content, timestamp, importance, tags)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [entry.id, entry.projectPath, entry.type, entry.content, entry.timestamp.toISOString(), entry.importance, JSON.stringify(entry.tags)],
                (err: any) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getContextById(id: string): Promise<ContextEntry | undefined> {
        return new Promise((resolve, reject) => {
            this.db!.get('SELECT * FROM contexts WHERE id = ?', [id], (err: any, row?: any) => {
                if (err) reject(err);
                else resolve(row ? this.rowToContextEntry(row) : undefined);
            });
        });
    }

    async getContexts(options: SearchOptions = {}): Promise<ContextEntry[]> {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM contexts';
            const params: any[] = [];
            
            if (options.projectPath) {
                query += ' WHERE projectPath = ?';
                params.push(options.projectPath);
            }
            
            query += ' ORDER BY timestamp DESC';

            if (options.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
            }
            if (options.offset) {
                query += ' OFFSET ?';
                params.push(options.offset);
            }
            
            this.db!.all(query, params, (err: any, rows?: any[]) => {
                if (err) reject(err);
                else resolve((rows || []).map(this.rowToContextEntry));
            });
        });
    }

    async updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void> {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates).map(v => Array.isArray(v) ? JSON.stringify(v) : v);

        return new Promise((resolve, reject) => {
            this.db!.run(`UPDATE contexts SET ${fields} WHERE id = ?`, [...values, id], (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async deleteContext(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db!.run('DELETE FROM contexts WHERE id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async searchContexts(query: string, options: SearchOptions = {}): Promise<ContextEntry[]> {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM contexts WHERE (content LIKE ? OR tags LIKE ?)';
            const params: any[] = [`%${query}%`, `%${query}%`];

            if (options.type && options.type !== 'all') {
                sql += ' AND type = ?';
                params.push(options.type);
            }
            if (options.importance) {
                sql += ' AND importance >= ?';
                params.push(options.importance);
            }

            sql += ' ORDER BY timestamp DESC';

            this.db!.all(sql, params, (err: any, rows?: any[]) => {
                if (err) reject(err);
                else resolve((rows || []).map(this.rowToContextEntry));
            });
        });
    }

    async getContextCount(options: SearchOptions = {}): Promise<number> {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM contexts';
            const params: any[] = [];
            if (options.type && options.type !== 'all') {
                query += ' WHERE type = ?';
                params.push(options.type);
            }
            this.db!.get(query, params, (err: any, row?: any) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    async addAgent(agentData: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent> {
        const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const newAgent: DatabaseAgent = { id, ...agentData };
        await this.addAgentWithId(newAgent);
        return newAgent;
    }

    async addAgentWithId(agent: DatabaseAgent): Promise<DatabaseAgent> {
        return new Promise((resolve, reject) => {
            this.db!.run(
                `INSERT INTO agents (id, name, description, emoji, specializations, color, enabled, isCustom, prompt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    agent.id, agent.name, agent.description, agent.emoji, 
                    JSON.stringify(agent.specializations), agent.color, 
                    agent.enabled ? 1 : 0, agent.isCustom ? 1 : 0, agent.prompt
                ],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(agent);
                }
            );
        });
    }

    async getAgentById(id: string): Promise<DatabaseAgent | undefined> {
        return new Promise((resolve, reject) => {
            this.db!.get('SELECT * FROM agents WHERE id = ?', [id], (err: any, row?: any) => {
                if (err) reject(err);
                else resolve(row ? this.rowToAgent(row) : undefined);
            });
        });
    }

    async getAllAgents(): Promise<DatabaseAgent[]> {
        return new Promise((resolve, reject) => {
            this.db!.all('SELECT * FROM agents ORDER BY isCustom ASC, name ASC', (err: any, rows?: any[]) => {
                if (err) reject(err);
                else resolve((rows || []).map(this.rowToAgent));
            });
        });
    }

    async updateAgent(id: string, updates: Partial<Omit<DatabaseAgent, 'id'>>): Promise<void> {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates).map(v => {
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (Array.isArray(v)) return JSON.stringify(v);
            return v;
        });

        return new Promise((resolve, reject) => {
            this.db!.run(`UPDATE agents SET ${fields} WHERE id = ?`, [...values, id], (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async deleteAgent(id: string): Promise<void> {
        const agent = await this.getAgentById(id);
        if (!agent) throw new Error(`Agent with id ${id} not found`);
        if (!agent.isCustom) throw new Error(`Cannot delete standard agent: ${agent.name}`);

        return new Promise((resolve, reject) => {
            this.db!.run('DELETE FROM agents WHERE id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getStats(): Promise<DatabaseStats> {
        const totalContexts = await this.getContextCount();
        const byType = await this.getGroupedCount('type');
        const byProject = await this.getGroupedCount('projectPath');
        
        let storageSize: number | undefined;
        try {
            const stats = await fs.stat(this.config!.path);
            storageSize = stats.size;
        } catch (error) { /* ignore */ }

        return {
            totalContexts,
            byType,
            byProject,
            storageSize,
            adapterType: 'sqlite'
        };
    }

    private async getGroupedCount(field: 'type' | 'projectPath'): Promise<Record<string, number>> {
        return new Promise((resolve, reject) => {
            this.db!.all(`SELECT ${field}, COUNT(*) as count FROM contexts GROUP BY ${field}`, (err: any, rows?: any[]) => {
                if (err) reject(err);
                else {
                    const result: Record<string, number> = {};
                    (rows || []).forEach(row => {
                        result[row[field]] = row.count;
                    });
                    resolve(result);
                }
            });
        });
    }

    private rowToContextEntry(row: ContextRow): ContextEntry {
        return {
            ...row,
            timestamp: new Date(row.timestamp),
            tags: JSON.parse(row.tags || '[]')
        } as ContextEntry;
    }

    private rowToAgent(row: AgentRow): DatabaseAgent {
        return {
            ...row,
            emoji: row.emoji || undefined,
            specializations: JSON.parse(row.specializations),
            color: row.color || undefined,
            enabled: Boolean(row.enabled),
            isCustom: Boolean(row.isCustom),
            prompt: row.prompt || undefined
        };
    }
}
