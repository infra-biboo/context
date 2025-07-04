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

    private async save(): Promise<void> {
        const entries = Array.from(this.contexts.values());
        await fs.writeFile(this.dbPath, JSON.stringify(entries, null, 2));
    }
}