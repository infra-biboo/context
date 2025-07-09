import * as path from 'path';
import * as fs from 'fs';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
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

export class SqlJsAdapter extends BaseDatabaseAdapter {
    private db: Database | null = null;
    private SQL: SqlJsStatic | null = null;
    private config: DatabaseConfig['sqlite'];
    private dbPath: string;

    constructor(config: DatabaseConfig['sqlite']) {
        super();
        if (!config?.path) {
            throw new Error('SQLite database path is required');
        }
        this.config = config;
        this.dbPath = config.path;
    }

    private async loadSqlJs(): Promise<SqlJsStatic> {
        try {
            // Get the extension path
            const extensionPath = path.dirname(path.dirname(path.dirname(path.dirname(__dirname))));
            const wasmPath = path.join(extensionPath, 'dist', 'assets', 'sql-wasm.wasm');
            
            // Check if wasm file exists
            if (!fs.existsSync(wasmPath)) {
                // Fallback: try to load from node_modules
                const fallbackWasmPath = path.join(extensionPath, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
                if (fs.existsSync(fallbackWasmPath)) {
                    const wasmBuffer = fs.readFileSync(fallbackWasmPath);
                    return await initSqlJs({ wasmBinary: wasmBuffer });
                } else {
                    throw new Error(`WASM file not found at ${wasmPath} or ${fallbackWasmPath}`);
                }
            }

            const wasmBuffer = fs.readFileSync(wasmPath);
            const SQL = await initSqlJs({ wasmBinary: wasmBuffer });
            Logger.info('✅ Successfully loaded sql.js with WebAssembly');
            return SQL;
        } catch (error) {
            const errorMessage = `Failed to load sql.js: ${(error as Error).message}`;
            Logger.error(errorMessage, error as Error);
            throw new Error(errorMessage);
        }
    }

    private loadDatabaseFromFile(): Uint8Array | undefined {
        try {
            if (fs.existsSync(this.dbPath)) {
                return fs.readFileSync(this.dbPath);
            }
            return undefined;
        } catch (error) {
            Logger.warn(`Could not read database file: ${(error as Error).message}`);
            return undefined;
        }
    }

    private saveDatabaseToFile(): void {
        try {
            if (this.db) {
                const data = this.db.export();
                const buffer = Buffer.from(data);
                
                // Ensure directory exists
                const dir = path.dirname(this.dbPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(this.dbPath, buffer);
                Logger.debug(`Database saved to: ${this.dbPath}`);
            }
        } catch (error) {
            Logger.error(`Failed to save database: ${(error as Error).message}`, error as Error);
        }
    }

    async connect(): Promise<void> {
        if (this.isConnectedFlag) {
            return;
        }

        try {
            // Load sql.js
            if (!this.SQL) {
                this.SQL = await this.loadSqlJs();
            }

            // Load existing database or create new one
            const existingData = this.loadDatabaseFromFile();
            this.db = new this.SQL.Database(existingData);

            await this.initializeSchema();
            this.isConnectedFlag = true;
            Logger.info(`SqlJsAdapter connected successfully to: ${this.dbPath}`);
        } catch (error) {
            Logger.error('Failed to connect SqlJsAdapter (non-critical):', error as Error);
            this.isConnectedFlag = false;
            // Don't throw - allow extension to continue without database
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.db) {
                this.saveDatabaseToFile();
                this.db.close();
                this.db = null;
                this.isConnectedFlag = false;
                Logger.info('SqlJsAdapter disconnected');
            }
        } catch (error) {
            Logger.error('Failed to disconnect SqlJsAdapter:', error as Error);
            throw error;
        }
    }

    private async initializeSchema(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected');
        }

        try {
            this.db.exec(`
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
            `);
            this.saveDatabaseToFile(); // Save after schema changes
        } catch (error) {
            throw new Error(`Failed to initialize schema: ${(error as Error).message}`);
        }
    }

    async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available. Extension functionality is limited.');
        }

        const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const timestamp = new Date().toISOString();

        try {
            const stmt = this.db.prepare(
                `INSERT INTO contexts (id, projectPath, type, content, timestamp, importance, tags)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            );
            stmt.run([id, entry.projectPath, entry.type, entry.content, timestamp, entry.importance, JSON.stringify(entry.tags)]);
            stmt.free();
            
            this.saveDatabaseToFile();
            return id;
        } catch (error) {
            throw new Error(`Failed to add context: ${(error as Error).message}`);
        }
    }

    async addMigratedContext(entry: ContextEntry): Promise<void> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available. Extension functionality is limited.');
        }

        try {
            const stmt = this.db.prepare(
                `INSERT INTO contexts (id, projectPath, type, content, timestamp, importance, tags)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            );
            stmt.run([entry.id, entry.projectPath, entry.type, entry.content, entry.timestamp.toISOString(), entry.importance, JSON.stringify(entry.tags)]);
            stmt.free();
            
            this.saveDatabaseToFile();
        } catch (error) {
            throw new Error(`Failed to add migrated context: ${(error as Error).message}`);
        }
    }

    async getContextById(id: string): Promise<ContextEntry | undefined> {
        if (!this.isConnectedFlag || !this.db) {
            return undefined;
        }

        try {
            const stmt = this.db.prepare('SELECT * FROM contexts WHERE id = ?');
            const rows = stmt.getAsObject([id]);
            stmt.free();
            
            return rows ? this.rowToContextEntry(rows as any) : undefined;
        } catch (error) {
            Logger.error(`Failed to get context by id: ${(error as Error).message}`, error as Error);
            return undefined;
        }
    }

    async getContexts(options: SearchOptions = {}): Promise<ContextEntry[]> {
        if (!this.isConnectedFlag || !this.db) {
            return [];
        }

        try {
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

            const stmt = this.db.prepare(query);
            const results: ContextEntry[] = [];
            
            stmt.bind(params);
            while (stmt.step()) {
                const row = stmt.getAsObject();
                results.push(this.rowToContextEntry(row as any));
            }
            stmt.free();

            return results;
        } catch (error) {
            Logger.error(`Failed to get contexts: ${(error as Error).message}`, error as Error);
            return [];
        }
    }

    async updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available');
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates).map(v => Array.isArray(v) ? JSON.stringify(v) : v);

        try {
            const stmt = this.db.prepare(`UPDATE contexts SET ${fields} WHERE id = ?`);
            stmt.run([...values, id]);
            stmt.free();
            
            this.saveDatabaseToFile();
        } catch (error) {
            throw new Error(`Failed to update context: ${(error as Error).message}`);
        }
    }

    async deleteContext(id: string): Promise<void> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available');
        }

        try {
            const stmt = this.db.prepare('DELETE FROM contexts WHERE id = ?');
            stmt.run([id]);
            stmt.free();
            
            this.saveDatabaseToFile();
        } catch (error) {
            throw new Error(`Failed to delete context: ${(error as Error).message}`);
        }
    }

    async searchContexts(query: string, options: SearchOptions = {}): Promise<ContextEntry[]> {
        if (!this.isConnectedFlag || !this.db) {
            return [];
        }

        try {
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

            const stmt = this.db.prepare(sql);
            const results: ContextEntry[] = [];
            
            stmt.bind(params);
            while (stmt.step()) {
                const row = stmt.getAsObject();
                results.push(this.rowToContextEntry(row as any));
            }
            stmt.free();

            return results;
        } catch (error) {
            Logger.error(`Failed to search contexts: ${(error as Error).message}`, error as Error);
            return [];
        }
    }

    async getContextCount(options: SearchOptions = {}): Promise<number> {
        if (!this.isConnectedFlag || !this.db) {
            return 0;
        }

        try {
            let query = 'SELECT COUNT(*) as count FROM contexts';
            const params: any[] = [];
            
            if (options.type && options.type !== 'all') {
                query += ' WHERE type = ?';
                params.push(options.type);
            }

            const stmt = this.db.prepare(query);
            stmt.bind(params);
            
            if (stmt.step()) {
                const row = stmt.getAsObject();
                stmt.free();
                return (row as any).count || 0;
            }
            
            stmt.free();
            return 0;
        } catch (error) {
            Logger.error(`Failed to get context count: ${(error as Error).message}`, error as Error);
            return 0;
        }
    }

    // Agent methods (similar pattern)
    async addAgent(agentData: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent> {
        const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const newAgent: DatabaseAgent = { id, ...agentData };
        await this.addAgentWithId(newAgent);
        return newAgent;
    }

    async addAgentWithId(agent: DatabaseAgent): Promise<DatabaseAgent> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available');
        }

        try {
            const stmt = this.db.prepare(
                `INSERT INTO agents (id, name, description, emoji, specializations, color, enabled, isCustom, prompt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            stmt.run([
                agent.id, agent.name, agent.description, agent.emoji || null,
                JSON.stringify(agent.specializations), agent.color || null,
                agent.enabled ? 1 : 0, agent.isCustom ? 1 : 0, agent.prompt || null
            ]);
            stmt.free();
            
            this.saveDatabaseToFile();
            return agent;
        } catch (error) {
            throw new Error(`Failed to add agent: ${(error as Error).message}`);
        }
    }

    async getAgentById(id: string): Promise<DatabaseAgent | undefined> {
        if (!this.isConnectedFlag || !this.db) {
            return undefined;
        }

        try {
            const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
            const rows = stmt.getAsObject([id]);
            stmt.free();
            
            return rows ? this.rowToAgent(rows as any) : undefined;
        } catch (error) {
            Logger.error(`Failed to get agent by id: ${(error as Error).message}`, error as Error);
            return undefined;
        }
    }

    async getAllAgents(): Promise<DatabaseAgent[]> {
        if (!this.isConnectedFlag || !this.db) {
            return [];
        }

        try {
            const stmt = this.db.prepare('SELECT * FROM agents ORDER BY isCustom ASC, name ASC');
            const results: DatabaseAgent[] = [];
            
            while (stmt.step()) {
                const row = stmt.getAsObject();
                results.push(this.rowToAgent(row as any));
            }
            stmt.free();

            return results;
        } catch (error) {
            Logger.error(`Failed to get all agents: ${(error as Error).message}`, error as Error);
            return [];
        }
    }

    async updateAgent(id: string, updates: Partial<Omit<DatabaseAgent, 'id'>>): Promise<void> {
        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available');
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates).map(v => {
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (Array.isArray(v)) return JSON.stringify(v);
            return v;
        });

        try {
            const stmt = this.db.prepare(`UPDATE agents SET ${fields} WHERE id = ?`);
            stmt.run([...values, id]);
            stmt.free();
            
            this.saveDatabaseToFile();
        } catch (error) {
            throw new Error(`Failed to update agent: ${(error as Error).message}`);
        }
    }

    async deleteAgent(id: string): Promise<void> {
        const agent = await this.getAgentById(id);
        if (!agent) throw new Error(`Agent with id ${id} not found`);
        if (!agent.isCustom) throw new Error(`Cannot delete standard agent: ${agent.name}`);

        if (!this.isConnectedFlag || !this.db) {
            throw new Error('SQLite database is not available');
        }

        try {
            const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
            stmt.run([id]);
            stmt.free();
            
            this.saveDatabaseToFile();
        } catch (error) {
            throw new Error(`Failed to delete agent: ${(error as Error).message}`);
        }
    }

    async getStats(): Promise<DatabaseStats> {
        const totalContexts = await this.getContextCount();
        const byType = await this.getGroupedCount('type');
        const byProject = await this.getGroupedCount('projectPath');

        return {
            totalContexts,
            byType,
            byProject,
            adapterType: 'sqljs'
        };
    }

    private async getGroupedCount(field: 'type' | 'projectPath'): Promise<Record<string, number>> {
        if (!this.isConnectedFlag || !this.db) {
            return {};
        }

        try {
            const stmt = this.db.prepare(`SELECT ${field}, COUNT(*) as count FROM contexts GROUP BY ${field}`);
            const result: Record<string, number> = {};
            
            while (stmt.step()) {
                const row = stmt.getAsObject() as any;
                result[row[field]] = row.count;
            }
            stmt.free();

            return result;
        } catch (error) {
            Logger.error(`Failed to get grouped count: ${(error as Error).message}`, error as Error);
            return {};
        }
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