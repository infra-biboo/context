
import * as sqlite3 from '@vscode/sqlite3';
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
    private db: sqlite3.Database | null = null;
    private config: DatabaseConfig['sqlite'];

    constructor(config: DatabaseConfig['sqlite']) {
        super();
        if (!config?.path) {
            throw new Error('SQLite database path is required');
        }
        this.config = config;
    }

    async connect(): Promise<void> {
        if (this.isConnectedFlag) {
            return;
        }
        try {
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
            this.db!.get('SELECT * FROM contexts WHERE id = ?', [id], (err: any, row: ContextRow | undefined) => {
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
            
            this.db!.all(query, params, (err: any, rows: ContextRow[]) => {
                if (err) reject(err);
                else resolve(rows.map(this.rowToContextEntry));
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

            this.db!.all(sql, params, (err: any, rows: ContextRow[]) => {
                if (err) reject(err);
                else resolve(rows.map(this.rowToContextEntry));
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
            this.db!.get(query, params, (err: any, row: { count: number }) => {
                if (err) reject(err);
                else resolve(row.count);
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
            this.db!.get('SELECT * FROM agents WHERE id = ?', [id], (err: any, row: AgentRow | undefined) => {
                if (err) reject(err);
                else resolve(row ? this.rowToAgent(row) : undefined);
            });
        });
    }

    async getAllAgents(): Promise<DatabaseAgent[]> {
        return new Promise((resolve, reject) => {
            this.db!.all('SELECT * FROM agents ORDER BY isCustom ASC, name ASC', (err: any, rows: AgentRow[]) => {
                if (err) reject(err);
                else resolve(rows.map(this.rowToAgent));
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
            this.db!.all(`SELECT ${field}, COUNT(*) as count FROM contexts GROUP BY ${field}`, (err: any, rows: any[]) => {
                if (err) reject(err);
                else {
                    const result: Record<string, number> = {};
                    rows.forEach(row => {
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
