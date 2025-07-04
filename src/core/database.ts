import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ContextEntry {
    id: string;
    projectPath: string;
    type: 'conversation' | 'decision' | 'code' | 'issue';
    content: string;
    timestamp: Date;
    importance: number;
    tags: string[];
}

export class ContextDatabase {
    private dbPath: string;
    private contexts: Map<string, ContextEntry> = new Map();

    constructor(private extensionContext: vscode.ExtensionContext) {
        this.dbPath = path.join(
            extensionContext.globalStorageUri.fsPath, 
            'contexts.json'
        );
        this.ensureStorageDir();
    }

    private async ensureStorageDir() {
        await fs.mkdir(
            this.extensionContext.globalStorageUri.fsPath, 
            { recursive: true }
        );
    }

    async initialize(): Promise<void> {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const entries: ContextEntry[] = JSON.parse(data);
            entries.forEach(entry => {
                this.contexts.set(entry.id, {
                    ...entry,
                    timestamp: new Date(entry.timestamp)
                });
            });
        } catch (error) {
            // File doesn't exist, start with empty database
            await this.save();
        }
    }

    async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
        const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const contextEntry: ContextEntry = {
            id,
            timestamp: new Date(),
            ...entry
        };
        
        this.contexts.set(id, contextEntry);
        await this.save();
        return id;
    }

    async getContexts(projectPath?: string): Promise<ContextEntry[]> {
        const entries = Array.from(this.contexts.values());
        if (projectPath) {
            return entries.filter(e => e.projectPath === projectPath);
        }
        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    async getContextById(id: string): Promise<ContextEntry | undefined> {
        return this.contexts.get(id);
    }

    async updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void> {
        const existing = this.contexts.get(id);
        if (!existing) {
            throw new Error(`Context with id ${id} not found`);
        }

        const updated: ContextEntry = {
            ...existing,
            ...updates,
            id: existing.id, // Preserve ID
            timestamp: existing.timestamp // Preserve original timestamp
        };

        this.contexts.set(id, updated);
        await this.save();
    }

    async deleteContext(id: string): Promise<void> {
        if (!this.contexts.has(id)) {
            throw new Error(`Context with id ${id} not found`);
        }
        
        this.contexts.delete(id);
        await this.save();
    }

    async searchContexts(query: string, options: {
        type?: string;
        projectPath?: string;
        tags?: string[];
        importance?: number;
        limit?: number;
    } = {}): Promise<ContextEntry[]> {
        let results = Array.from(this.contexts.values());

        // Filter by project path
        if (options.projectPath) {
            results = results.filter(ctx => ctx.projectPath === options.projectPath);
        }

        // Filter by type
        if (options.type && options.type !== 'all') {
            results = results.filter(ctx => ctx.type === options.type);
        }

        // Filter by minimum importance
        if (options.importance !== undefined) {
            results = results.filter(ctx => ctx.importance >= options.importance!);
        }

        // Filter by tags
        if (options.tags && options.tags.length > 0) {
            results = results.filter(ctx => 
                options.tags!.some(tag => ctx.tags.includes(tag))
            );
        }

        // Text search
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            results = results.filter(ctx => 
                ctx.content.toLowerCase().includes(searchTerm) ||
                ctx.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by relevance (importance + timestamp)
        results.sort((a, b) => {
            const scoreA = a.importance + (new Date(a.timestamp).getTime() / 1000000000);
            const scoreB = b.importance + (new Date(b.timestamp).getTime() / 1000000000);
            return scoreB - scoreA;
        });

        return results.slice(0, options.limit || 100);
    }

    private async save(): Promise<void> {
        const entries = Array.from(this.contexts.values());
        await fs.writeFile(this.dbPath, JSON.stringify(entries, null, 2));
    }
}