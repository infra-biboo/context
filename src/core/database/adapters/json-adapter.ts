import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseDatabaseAdapter } from '../database-adapter';
import { ContextEntry, DatabaseAgent, SearchOptions, DatabaseStats, DatabaseConfig } from '../types';
import { Logger } from '../../../utils/logger';

interface JSONDatabase {
  contexts: ContextEntry[];
  agents: DatabaseAgent[];
  metadata: {
    version: string;
    lastUpdated: string;
  };
}

/**
 * Simple JSON-based database adapter
 * No native dependencies, works everywhere!
 */
export class JSONAdapter extends BaseDatabaseAdapter {
  private data: JSONDatabase = {
    contexts: [],
    agents: [],
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  };
  private dataPath: string;
  private lockPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(config: { path: string }) {
    super();
    if (!config?.path) {
      throw new Error('JSON database path is required');
    }
    
    const dir = path.dirname(config.path);
    const filename = path.basename(config.path, '.json');
    
    this.dataPath = path.join(dir, `${filename}.json`);
    this.lockPath = path.join(dir, `${filename}.lock`);
  }

  async connect(): Promise<void> {
    try {
      // Ensure directory exists
      await this.ensureDirectoryExists();
      
      // Load existing data
      await this.load();
      
      this.isConnectedFlag = true;
      Logger.info('JSONAdapter connected successfully');
    } catch (error) {
      Logger.error('Failed to connect JSONAdapter:', error as Error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Save any pending changes
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        await this.save();
      }
      
      this.isConnectedFlag = false;
      Logger.info('JSONAdapter disconnected');
    } catch (error) {
      Logger.error('Failed to disconnect JSONAdapter:', error as Error);
      throw error;
    }
  }

  // Context operations
  async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const timestamp = new Date();
    
    const newContext: ContextEntry = {
      id,
      timestamp,
      ...entry
    };
    
    this.data.contexts.push(newContext);
    await this.scheduleSave();
    
    Logger.info(`Context added: ${id}`);
    return id;
  }

  async getContexts(options: SearchOptions = {}): Promise<ContextEntry[]> {
    let contexts = [...this.data.contexts];
    
    // Apply filters
    if (options.projectPath) {
      contexts = contexts.filter(c => c.projectPath === options.projectPath);
    }
    
    if (options.type && options.type !== 'all') {
      contexts = contexts.filter(c => c.type === options.type);
    }
    
    if (options.importance !== undefined) {
      contexts = contexts.filter(c => c.importance >= options.importance!);
    }
    
    if (options.tags && options.tags.length > 0) {
      contexts = contexts.filter(c => 
        options.tags!.some(tag => c.tags.includes(tag))
      );
    }
    
    // Sort by timestamp (newest first)
    contexts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply pagination
    if (options.offset) {
      contexts = contexts.slice(options.offset);
    }
    
    if (options.limit) {
      contexts = contexts.slice(0, options.limit);
    }
    
    return contexts;
  }

  async getContextById(id: string): Promise<ContextEntry | undefined> {
    return this.data.contexts.find(c => c.id === id);
  }

  async updateContext(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'timestamp'>>): Promise<void> {
    const index = this.data.contexts.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error(`Context with id ${id} not found`);
    }
    
    this.data.contexts[index] = {
      ...this.data.contexts[index],
      ...updates
    };
    
    await this.scheduleSave();
    Logger.info(`Context updated: ${id}`);
  }

  async deleteContext(id: string): Promise<void> {
    const index = this.data.contexts.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error(`Context with id ${id} not found`);
    }
    
    this.data.contexts.splice(index, 1);
    await this.scheduleSave();
    Logger.info(`Context deleted: ${id}`);
  }

  async searchContexts(query: string, options: SearchOptions = {}): Promise<ContextEntry[]> {
    let contexts = await this.getContexts(options);
    
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      contexts = contexts.filter(c => 
        c.content.toLowerCase().includes(searchTerm) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return contexts;
  }

  // Agent operations
  async addAgent(agentData: Omit<DatabaseAgent, 'id'>): Promise<DatabaseAgent> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const newAgent: DatabaseAgent = {
      id,
      ...agentData
    };
    
    this.data.agents.push(newAgent);
    await this.scheduleSave();
    
    Logger.info(`Agent added: ${id}`);
    return newAgent;
  }

  async addAgentWithId(agent: DatabaseAgent): Promise<DatabaseAgent> {
    // Check if agent with this ID already exists
    const existingIndex = this.data.agents.findIndex(a => a.id === agent.id);
    if (existingIndex !== -1) {
      throw new Error(`Agent with id ${agent.id} already exists`);
    }
    
    this.data.agents.push(agent);
    await this.scheduleSave();
    
    Logger.info(`Agent added with predefined ID: ${agent.id}`);
    return agent;
  }

  async getAllAgents(): Promise<DatabaseAgent[]> {
    return [...this.data.agents].sort((a, b) => {
      // Standard agents first, then custom
      if (a.isCustom !== b.isCustom) {
        return a.isCustom ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async getAgentById(id: string): Promise<DatabaseAgent | undefined> {
    return this.data.agents.find(a => a.id === id);
  }

  async updateAgent(id: string, updates: Partial<Omit<DatabaseAgent, 'id'>>): Promise<void> {
    const index = this.data.agents.findIndex(a => a.id === id);
    
    if (index === -1) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    this.data.agents[index] = {
      ...this.data.agents[index],
      ...updates
    };
    
    await this.scheduleSave();
    Logger.info(`Agent updated: ${id}`);
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = await this.getAgentById(id);
    
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    if (!agent.isCustom) {
      throw new Error(`Cannot delete standard agent: ${agent.name}`);
    }
    
    const index = this.data.agents.findIndex(a => a.id === id);
    this.data.agents.splice(index, 1);
    
    await this.scheduleSave();
    Logger.info(`Agent deleted: ${id}`);
  }

  // Utility operations
  async getStats(): Promise<DatabaseStats> {
    const totalContexts = this.data.contexts.length;
    
    // Count by type
    const byType: Record<string, number> = {};
    this.data.contexts.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    
    // Count by project
    const byProject: Record<string, number> = {};
    this.data.contexts.forEach(c => {
      byProject[c.projectPath] = (byProject[c.projectPath] || 0) + 1;
    });
    
    // Get file size
    let storageSize: number | undefined;
    try {
      const stats = await fs.stat(this.dataPath);
      storageSize = stats.size;
    } catch (error) {
      // File might not exist yet
    }
    
    return {
      totalContexts,
      byType,
      byProject,
      storageSize,
      adapterType: 'json'
    };
  }

  async getContextCount(options: SearchOptions = {}): Promise<number> {
    const contexts = await this.getContexts(options);
    return contexts.length;
  }

  // Private methods
  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.dataPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      Logger.error('Failed to create directory:', error as Error);
      throw error;
    }
  }

  private async load(): Promise<void> {
    Logger.info(`JSONAdapter attempting to load from: ${this.dataPath}`);
    
    try {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      const loaded = JSON.parse(content) as JSONDatabase;
      
      // Convert date strings back to Date objects
      loaded.contexts = loaded.contexts.map(c => ({
        ...c,
        timestamp: new Date(c.timestamp)
      }));
      
      this.data = loaded;
      Logger.info(`Loaded ${this.data.contexts.length} contexts and ${this.data.agents.length} agents`);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      Logger.info(`File not found or invalid - starting first time setup. Error: ${error}`);
      Logger.info(`Will create new database at: ${this.dataPath}`);
      
      // Initialize with standard agents and welcome context
      await this.initializeStandardAgents();
      await this.createWelcomeContext();
      
      // Save initial data
      Logger.info('Saving initial database data...');
      await this.save();
      Logger.info('Initial database setup completed');
    }
  }

  private async save(): Promise<void> {
    try {
      // Update metadata
      this.data.metadata.lastUpdated = new Date().toISOString();
      
      // Write to temp file first
      const tempPath = `${this.dataPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      
      // Atomic rename
      await fs.rename(tempPath, this.dataPath);
      
      Logger.info(`Saved ${this.data.contexts.length} contexts and ${this.data.agents.length} agents`);
    } catch (error) {
      Logger.error('Failed to save database:', error as Error);
      throw error;
    }
  }

  private async scheduleSave(): Promise<void> {
    // Cancel existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Schedule save in 100ms to batch multiple changes
    this.saveTimeout = setTimeout(async () => {
      await this.save();
      this.saveTimeout = null;
    }, 100);
  }

  private async initializeStandardAgents(): Promise<void> {
    const standardAgents: Omit<DatabaseAgent, 'id'>[] = [
      {
        name: 'Architect',
        description: 'System design and architecture decisions',
        emoji: '🏗️',
        specializations: ['System Design', 'Architecture Patterns', 'Scalability', 'Technical Decisions'],
        color: '#FF6B35',
        enabled: true,
        isCustom: false
      },
      {
        name: 'Backend',
        description: 'Server-side development and APIs',
        emoji: '⚙️',
        specializations: ['REST APIs', 'Database Design', 'Authentication', 'Performance'],
        color: '#4ECDC4',
        enabled: true,
        isCustom: false
      },
      {
        name: 'Frontend',
        description: 'User interface and experience',
        emoji: '🎨',
        specializations: ['React/Vue', 'UI/UX Design', 'Responsive Design', 'Accessibility'],
        color: '#45B7D1',
        enabled: true,
        isCustom: false
      }
    ];

    // Add agents directly to data without triggering save (will be saved by load method)
    for (const agentData of standardAgents) {
      const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newAgent: DatabaseAgent = { id, ...agentData };
      this.data.agents.push(newAgent);
      Logger.info(`Standard agent '${agentData.name}' initialized with ID: ${id}`);
    }
  }

  private async createWelcomeContext(): Promise<void> {
    // dataPath is something like: /project/.context-manager/contexts.json
    // workspaceFolder would be: /project/.context-manager
    // projectPath would be: /project
    const workspaceFolder = path.dirname(this.dataPath); // .context-manager folder
    const projectPath = path.dirname(workspaceFolder);   // project root
    
    Logger.info(`Creating welcome context - dataPath: ${this.dataPath}, projectPath: ${projectPath}`);
    
    const welcomeContext: Omit<ContextEntry, 'id' | 'timestamp'> = {
      projectPath,
      type: 'decision',
      content: `¡Bienvenido a Claude Context Manager! 🎉

Esta extensión actúa como "memoria inteligente" para tu proyecto, capturando automáticamente:

📝 **Contextos importantes**:
- Decisiones de arquitectura
- Cambios en el código
- Conversaciones con IA
- Issues y problemas

🔌 **Integración MCP**:
- Servidor MCP para Claude Desktop
- Herramientas: get_context, add_context, search_contexts
- Acceso directo desde Claude

🤝 **Agentes especializados**:
- Architect 🏗️ - Decisiones de arquitectura
- Backend ⚙️ - Desarrollo del servidor
- Frontend 🎨 - Interfaz de usuario

💾 **Almacenamiento**:
- Datos guardados en .context-manager/contexts.json
- Formato unificado para extensión y MCP

¡Comienza a capturar contexto y mejora tu flujo de trabajo con IA!`,
      importance: 9,
      tags: ['welcome', 'setup', 'first-time']
    };

    const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const timestamp = new Date();
    
    // Add directly to data without triggering save (will be saved by load method)
    this.data.contexts.push({
      id,
      timestamp,
      ...welcomeContext
    });
    
    Logger.info('Welcome context created for first-time setup');
  }
}