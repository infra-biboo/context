# Arquitectura de Adaptadores de Base de Datos

## Resumen Ejecutivo

Esta implementación crea una arquitectura flexible de adaptadores que permite usar tanto SQLite local para máxima velocidad como PostgreSQL con vectores para búsqueda semántica avanzada. La arquitectura permite configuraciones híbridas y migración transparente entre sistemas.

## Objetivos

1. **Flexibilidad**: Soporte para múltiples tipos de base de datos
2. **Rendimiento**: SQLite local para velocidad máxima
3. **Escalabilidad**: PostgreSQL para equipos y búsqueda semántica
4. **Transparencia**: API única independiente del backend
5. **Migración**: Cambio transparente entre adaptadores

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    ContextDatabase                          │
│                  (Interfaz Principal)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  DatabaseAdapter                            │
│                 (Interfaz Abstracta)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  SQLiteAdapter  │ │PostgreSQLAdapter│ │  HybridAdapter  │
│   (Local Fast)  │ │ (Vector Search) │ │ (Best of Both)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Fase 1: Interfaz DatabaseAdapter

### 1.1 Crear tipos base

**Archivo**: `src/core/database/types.ts`

```typescript
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'hybrid';
  sqlite?: {
    path: string;
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
  hybrid?: {
    sqlite: DatabaseConfig['sqlite'];
    postgresql: DatabaseConfig['postgresql'];
    syncInterval?: number; // minutes
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
}
```

### 1.2 Crear interfaz DatabaseAdapter

**Archivo**: `src/core/database/database-adapter.ts`

```typescript
export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Context operations
  addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string>;
  getContexts(options?: SearchOptions): Promise<ContextEntry[]>;
  getContextById(id: string): Promise<ContextEntry | undefined>;
  updateContext(id: string, updates: Partial<ContextEntry>): Promise<void>;
  deleteContext(id: string): Promise<void>;
  
  // Search operations
  searchContexts(query: string, options?: SearchOptions): Promise<ContextEntry[]>;
  searchSimilar?(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]>;
  
  // Agent operations
  addAgent(agent: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent>;
  getAllAgents(): Promise<DatabaseAgent[]>;
  getAgentById(id: string): Promise<DatabaseAgent | undefined>;
  updateAgent(id: string, updates: Partial<DatabaseAgent>): Promise<void>;
  deleteAgent(id: string): Promise<void>;
  
  // Utility operations
  getStats(): Promise<DatabaseStats>;
  getContextCount(options?: SearchOptions): Promise<number>;
  
  // Migration and sync (for hybrid)
  exportData?(): Promise<any>;
  importData?(data: any): Promise<void>;
  syncWith?(otherAdapter: DatabaseAdapter): Promise<void>;
}
```

## Fase 2: SQLiteAdapter

### 2.1 Crear wrapper async para sqlite3

**Archivo**: `src/core/database/sqlite-wrapper.ts`

```typescript
import * as sqlite3 from 'sqlite3';

export class SQLiteWrapper {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
```

### 2.2 Implementar SQLiteAdapter

**Archivo**: `src/core/database/sqlite-adapter.ts`

```typescript
export class SQLiteAdapter implements DatabaseAdapter {
  private db: SQLiteWrapper;
  private isConnectedFlag: boolean = false;

  constructor(private config: DatabaseConfig['sqlite']) {}

  async connect(): Promise<void> {
    // Initialize database and create tables
    // Implementation details...
  }

  async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
    // Convert from better-sqlite3 sync calls to async
    // Implementation details...
  }

  // ... rest of methods
}
```

## Fase 3: PostgreSQLAdapter

### 3.1 Agregar dependencias

```bash
npm install pg @types/pg
npm install @pgvector/pg  # Para búsqueda vectorial
```

### 3.2 Crear esquema PostgreSQL

**Archivo**: `src/core/database/postgresql-schema.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Contexts table with vector support
CREATE TABLE IF NOT EXISTS contexts (
    id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('conversation', 'decision', 'code', 'issue')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    importance INTEGER NOT NULL DEFAULT 5,
    tags JSONB DEFAULT '[]',
    embedding vector(1536), -- OpenAI embedding size
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_contexts_type ON contexts(type);
    CREATE INDEX IF NOT EXISTS idx_contexts_timestamp ON contexts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_contexts_project_path ON contexts(project_path);
    CREATE INDEX IF NOT EXISTS idx_contexts_importance ON contexts(importance);
    CREATE INDEX IF NOT EXISTS idx_contexts_tags ON contexts USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_contexts_embedding ON contexts USING ivfflat (embedding vector_cosine_ops);
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    emoji TEXT,
    specializations JSONB NOT NULL,
    color TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    prompt TEXT
);
```

### 3.3 Implementar PostgreSQLAdapter

**Archivo**: `src/core/database/postgresql-adapter.ts`

```typescript
import { Pool, PoolClient } from 'pg';

export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;
  private isConnectedFlag: boolean = false;

  constructor(private config: DatabaseConfig['postgresql']) {}

  async connect(): Promise<void> {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection and create schema
    await this.initializeSchema();
    this.isConnectedFlag = true;
  }

  async searchSimilar(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]> {
    const client = await this.pool.connect();
    try {
      const similarity = options?.similarity || 0.7;
      const limit = options?.limit || 10;
      
      const query = `
        SELECT *, 1 - (embedding <=> $1) as similarity
        FROM contexts 
        WHERE 1 - (embedding <=> $1) > $2
        ORDER BY similarity DESC
        LIMIT $3
      `;
      
      const result = await client.query(query, [JSON.stringify(embedding), similarity, limit]);
      return result.rows.map(this.rowToContextEntry);
    } finally {
      client.release();
    }
  }

  // ... rest of methods
}
```

## Fase 4: HybridAdapter

### 4.1 Implementar HybridAdapter

**Archivo**: `src/core/database/hybrid-adapter.ts`

```typescript
export class HybridAdapter implements DatabaseAdapter {
  private sqliteAdapter: SQLiteAdapter;
  private postgresAdapter: PostgreSQLAdapter;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private config: DatabaseConfig['hybrid']) {
    this.sqliteAdapter = new SQLiteAdapter(config.sqlite);
    this.postgresAdapter = new PostgreSQLAdapter(config.postgresql);
  }

  async connect(): Promise<void> {
    // Connect to both adapters
    await Promise.all([
      this.sqliteAdapter.connect(),
      this.postgresAdapter.connect()
    ]);

    // Start sync interval
    if (this.config.syncInterval) {
      this.startSyncInterval();
    }
  }

  async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
    // Write to SQLite first (fast)
    const id = await this.sqliteAdapter.addContext(entry);
    
    // Async write to PostgreSQL (background)
    this.postgresAdapter.addContext({ ...entry, id, timestamp: new Date() })
      .catch(err => console.error('Failed to sync to PostgreSQL:', err));
    
    return id;
  }

  async searchContexts(query: string, options?: SearchOptions): Promise<ContextEntry[]> {
    // Use SQLite for fast text search
    return this.sqliteAdapter.searchContexts(query, options);
  }

  async searchSimilar(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]> {
    // Use PostgreSQL for vector search
    return this.postgresAdapter.searchSimilar!(embedding, options);
  }

  private startSyncInterval(): void {
    const intervalMs = (this.config.syncInterval || 5) * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.syncDatabases().catch(err => 
        console.error('Sync failed:', err)
      );
    }, intervalMs);
  }

  private async syncDatabases(): Promise<void> {
    // Implementation of bidirectional sync
    // SQLite -> PostgreSQL for new items
    // PostgreSQL -> SQLite for embeddings
  }
}
```

## Fase 5: DatabaseFactory

### 5.1 Crear factory

**Archivo**: `src/core/database/database-factory.ts`

```typescript
export class DatabaseFactory {
  static create(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'sqlite':
        if (!config.sqlite) {
          throw new Error('SQLite configuration required');
        }
        return new SQLiteAdapter(config.sqlite);
        
      case 'postgresql':
        if (!config.postgresql) {
          throw new Error('PostgreSQL configuration required');
        }
        return new PostgreSQLAdapter(config.postgresql);
        
      case 'hybrid':
        if (!config.hybrid) {
          throw new Error('Hybrid configuration required');
        }
        return new HybridAdapter(config.hybrid);
        
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  static createFromEnvironment(): DatabaseAdapter {
    const config = this.getConfigFromEnvironment();
    return this.create(config);
  }

  private static getConfigFromEnvironment(): DatabaseConfig {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    switch (dbType) {
      case 'sqlite':
        return {
          type: 'sqlite',
          sqlite: {
            path: process.env.SQLITE_PATH || './context.db'
          }
        };
        
      case 'postgresql':
        return {
          type: 'postgresql',
          postgresql: {
            host: process.env.PG_HOST || 'localhost',
            port: parseInt(process.env.PG_PORT || '5432'),
            database: process.env.PG_DATABASE || 'context_manager',
            username: process.env.PG_USERNAME || 'postgres',
            password: process.env.PG_PASSWORD || '',
            ssl: process.env.PG_SSL === 'true'
          }
        };
        
      case 'hybrid':
        return {
          type: 'hybrid',
          hybrid: {
            sqlite: {
              path: process.env.SQLITE_PATH || './context.db'
            },
            postgresql: {
              host: process.env.PG_HOST || 'localhost',
              port: parseInt(process.env.PG_PORT || '5432'),
              database: process.env.PG_DATABASE || 'context_manager',
              username: process.env.PG_USERNAME || 'postgres',
              password: process.env.PG_PASSWORD || '',
              ssl: process.env.PG_SSL === 'true'
            },
            syncInterval: parseInt(process.env.SYNC_INTERVAL || '5')
          }
        };
        
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
```

## Fase 6: Migrar ContextDatabase

### 6.1 Actualizar ContextDatabase

**Archivo**: `src/core/database.ts` (actualizado)

```typescript
export class ContextDatabase {
  private adapter: DatabaseAdapter;

  constructor(
    private extensionContext: vscode.ExtensionContext,
    config?: DatabaseConfig
  ) {
    // Use provided config or default to SQLite
    const dbConfig = config || {
      type: 'sqlite',
      sqlite: {
        path: path.join(extensionContext.globalStorageUri.fsPath, 'context.db')
      }
    };

    this.adapter = DatabaseFactory.create(dbConfig);
  }

  async initialize(): Promise<void> {
    await this.adapter.connect();
  }

  // Delegate all methods to adapter
  async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
    return this.adapter.addContext(entry);
  }

  async searchSimilar(embedding: number[], options?: VectorSearchOptions): Promise<ContextEntry[]> {
    if (!this.adapter.searchSimilar) {
      throw new Error('Vector search not supported by current adapter');
    }
    return this.adapter.searchSimilar(embedding, options);
  }

  // ... rest of methods delegate to adapter
}
```

## Fase 7: Configuración y Testing

### 7.1 Variables de entorno

**Archivo**: `.env.example`

```bash
# Database Configuration
DB_TYPE=sqlite  # sqlite | postgresql | hybrid

# SQLite Configuration
SQLITE_PATH=./context.db

# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=context_manager
PG_USERNAME=postgres
PG_PASSWORD=your_password
PG_SSL=false

# Hybrid Configuration
SYNC_INTERVAL=5  # minutes
```

### 7.2 Tests

**Archivo**: `src/core/database/__tests__/database-adapter.test.ts`

```typescript
describe('DatabaseAdapter', () => {
  let adapter: DatabaseAdapter;

  beforeEach(async () => {
    adapter = DatabaseFactory.create({
      type: 'sqlite',
      sqlite: { path: ':memory:' }
    });
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Context Operations', () => {
    it('should add and retrieve contexts', async () => {
      const entry = {
        projectPath: '/test',
        type: 'conversation' as const,
        content: 'Test content',
        importance: 5,
        tags: ['test']
      };

      const id = await adapter.addContext(entry);
      const retrieved = await adapter.getContextById(id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.content).toBe('Test content');
    });

    it('should search contexts', async () => {
      // Add test data
      await adapter.addContext({
        projectPath: '/test',
        type: 'conversation',
        content: 'JavaScript function',
        importance: 5,
        tags: ['js']
      });

      const results = await adapter.searchContexts('JavaScript');
      expect(results).toHaveLength(1);
    });
  });

  describe('Vector Search', () => {
    it('should perform vector search if supported', async () => {
      if (!adapter.searchSimilar) {
        return; // Skip if not supported
      }

      const embedding = new Array(1536).fill(0.1);
      const results = await adapter.searchSimilar(embedding);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
```

## Fase 8: Integración con MCP

### 8.1 Actualizar MCP Server

**Archivo**: `src/mcp/server.ts` (actualizado)

```typescript
export class MCPServer {
  constructor(
    private database: ContextDatabase,
    private agentManager: AgentManager,
    private analysisService: ContextAnalysisService = new ContextAnalysisService(),
    private formattingService: ResponseFormattingService = new ResponseFormattingService()
  ) {
    this.server = new McpServer({
      name: 'claude-context-manager',
      version: '1.0.0',
    });

    this.setupTools();
  }

  private setupTools(): void {
    // Add vector search tool
    this.server.registerTool(
      'search_similar_contexts',
      {
        title: 'Search Similar Contexts',
        description: 'Find contexts similar to the given embedding or text',
        inputSchema: {
          embedding: z.array(z.number()).optional().describe('Embedding vector'),
          text: z.string().optional().describe('Text to find similar contexts for'),
          limit: z.number().optional().describe('Number of results to return'),
          similarity: z.number().optional().describe('Similarity threshold (0-1)')
        }
      },
      async ({ embedding, text, limit, similarity }) => {
        return await this.handleSearchSimilar({ embedding, text, limit, similarity });
      }
    );

    // ... existing tools
  }

  private async handleSearchSimilar(args: any) {
    let searchEmbedding: number[];

    if (args.embedding) {
      searchEmbedding = args.embedding;
    } else if (args.text) {
      // Generate embedding from text (would need OpenAI API or similar)
      searchEmbedding = await this.generateEmbedding(args.text);
    } else {
      throw new Error('Either embedding or text must be provided');
    }

    const results = await this.database.searchSimilar(searchEmbedding, {
      limit: args.limit || 10,
      similarity: args.similarity || 0.7
    });

    return this.formattingService.formatSearchResults(results);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Implementation would call OpenAI API or local embedding model
    // For now, return dummy embedding
    return new Array(1536).fill(0.1);
  }
}
```

## Cronograma de Implementación

### Semana 1: Fundamentos
- **Día 1-2**: Crear tipos e interfaces
- **Día 3-4**: Implementar SQLiteWrapper
- **Día 5**: Implementar SQLiteAdapter básico

### Semana 2: PostgreSQL
- **Día 1-2**: Configurar PostgreSQL con pgvector
- **Día 3-4**: Implementar PostgreSQLAdapter
- **Día 5**: Testing de ambos adaptadores

### Semana 3: Híbrido y Factory
- **Día 1-2**: Implementar HybridAdapter
- **Día 3**: Crear DatabaseFactory
- **Día 4-5**: Migrar ContextDatabase

### Semana 4: Integración y Testing
- **Día 1-2**: Actualizar MCP Server
- **Día 3-4**: Testing completo
- **Día 5**: Documentación y cleanup

## Beneficios de la Implementación

1. **Performance**: SQLite local para velocidad máxima
2. **Escalabilidad**: PostgreSQL para equipos grandes
3. **Búsqueda Avanzada**: Vectores para búsqueda semántica
4. **Flexibilidad**: Cambio fácil entre adaptadores
5. **Migración**: Transparente para el usuario final
6. **Híbrido**: Lo mejor de ambos mundos

## Configuraciones Recomendadas

### Desarrollo Individual
```typescript
{
  type: 'sqlite',
  sqlite: { path: './context.db' }
}
```

### Equipo Pequeño
```typescript
{
  type: 'postgresql',
  postgresql: { host: 'localhost', database: 'context_manager', ... }
}
```

### Equipo Grande con IA
```typescript
{
  type: 'hybrid',
  hybrid: {
    sqlite: { path: './context.db' },
    postgresql: { host: 'prod-db.company.com', ... },
    syncInterval: 2
  }
}
```

Esta arquitectura proporciona la flexibilidad necesaria para escalar desde desarrollo individual hasta equipos grandes con búsqueda semántica avanzada.