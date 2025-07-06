import { ContextEntry, DatabaseAgent } from './types';
import { SearchOptions, VectorSearchOptions, DatabaseStats, SyncResult } from './types';

export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Context operations
  addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string>;
  getContexts(options?: SearchOptions): Promise<ContextEntry[]>;
  getContextById(id: string): Promise<ContextEntry | undefined>;
  updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void>;
  deleteContext(id: string): Promise<void>;
  
  // Search operations
  searchContexts(query: string, options?: SearchOptions): Promise<ContextEntry[]>;
  searchSimilar?(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]>;
  
  // Agent operations
  addAgent(agent: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent>;
  getAllAgents(): Promise<DatabaseAgent[]>;
  getAgentById(id: string): Promise<DatabaseAgent | undefined>;
  updateAgent(id: string, updates: Partial<Omit<DatabaseAgent, 'id'>>): Promise<void>;
  deleteAgent(id: string): Promise<void>;
  
  // Utility operations
  getStats(): Promise<DatabaseStats>;
  getContextCount(options?: SearchOptions): Promise<number>;
  
  // Migration and sync (for hybrid)
  exportData?(): Promise<any>;
  importData?(data: any): Promise<void>;
  syncWith?(otherAdapter: DatabaseAdapter): Promise<SyncResult>;

  // Health check
  healthCheck(): Promise<boolean>;
}

export abstract class BaseDatabaseAdapter implements DatabaseAdapter {
  protected isConnectedFlag: boolean = false;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  
  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  abstract addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string>;
  abstract getContexts(options?: SearchOptions): Promise<ContextEntry[]>;
  abstract getContextById(id: string): Promise<ContextEntry | undefined>;
  abstract updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void>;
  abstract deleteContext(id: string): Promise<void>;
  abstract searchContexts(query: string, options?: SearchOptions): Promise<ContextEntry[]>;
  
  abstract addAgent(agent: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent>;
  abstract getAllAgents(): Promise<DatabaseAgent[]>;
  abstract getAgentById(id: string): Promise<DatabaseAgent | undefined>;
  abstract updateAgent(id: string, updates: Partial<Omit<DatabaseAgent, 'id'>>): Promise<void>;
  abstract deleteAgent(id: string): Promise<void>;
  
  abstract getStats(): Promise<DatabaseStats>;
  abstract getContextCount(options?: SearchOptions): Promise<number>;

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      
      // Simple health check - try to get stats
      await this.getStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Default implementations for optional methods
  searchSimilar?(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]>;
  exportData?(): Promise<any>;
  importData?(data: any): Promise<void>;
  syncWith?(otherAdapter: DatabaseAdapter): Promise<SyncResult>;
}