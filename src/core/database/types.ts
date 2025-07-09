export interface DatabaseConfig {
  type: 'json' | 'postgresql' | 'hybrid' | 'sqlite';
  json?: {
    path: string;
    maxContexts?: number; // Default 1000
  };
  sqlite?: {
    path: string;
    extensionPath?: string;
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    vectorDimensions?: number; // For embeddings
  };
  hybrid?: {
    json: DatabaseConfig['json'];
    postgresql: DatabaseConfig['postgresql'];
    syncInterval?: number; // minutes
    maxLocalContexts?: number; // How many to keep in JSON
  };
}

export interface SearchOptions {
  type?: 'conversation' | 'decision' | 'code' | 'issue' | 'all';
  projectPath?: string;
  tags?: string[];
  importance?: number;
  limit?: number;
  offset?: number;
}

export interface VectorSearchOptions extends SearchOptions {
  embedding?: number[];
  similarity?: number; // 0-1 threshold
  hybridWeight?: number; // 0-1 balance between text and vector
}

export interface DatabaseStats {
  totalContexts: number;
  byType: Record<string, number>;
  byProject: Record<string, number>;
  storageSize?: number;
  lastSync?: Date;
  adapterType: string;
}

export interface SyncResult {
  itemsSynced: number;
  errors: number;
  lastSyncTime: Date;
}

// Define core types here instead of importing from database
export interface ContextEntry {
    id: string;
    projectPath: string;
    type: 'conversation' | 'decision' | 'code' | 'issue' | 'custom' | 'note' | 'reference';
    content: string;
    timestamp: Date;
    importance: number;
    tags: string[];
}

export interface DatabaseAgent {
    id: string;
    name: string;
    description: string;
    emoji?: string;
    specializations: string[];
    color?: string;
    enabled: boolean;
    isCustom: boolean;
    prompt?: string;
}
