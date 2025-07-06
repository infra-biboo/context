import { Agent, AgentState, AgentType, AgentStatus } from './agent-types';
import { ContextDatabase, DatabaseAgent } from '../core/database';
import { Logger } from '../utils/logger';

export class AgentManager {
    private agents: Map<string, Agent> = new Map();
    private collaborationMode: 'individual' | 'collaborative' | 'hierarchical' = 'collaborative';
    private listeners: Set<(status: AgentStatus) => void> = new Set();
    private initialized = false;

    constructor(private database: ContextDatabase) {
        // Don't initialize synchronously - call initialize() method
        Logger.info('Agent Manager created, call initialize() to load agents');
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.loadAgentsFromDB();
            this.initialized = true;
            Logger.info('Agent Manager initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize Agent Manager:', error as Error);
            throw error;
        }
    }

    private async loadAgentsFromDB(): Promise<void> {
        try {
            const dbAgents = await this.database.getAllAgents();
            
            // If no agents in DB, populate with standard agents
            if (dbAgents.length === 0) {
                Logger.info('No agents found in database, populating standard agents');
                await this.database.populateStandardAgents();
                // Reload after population
                const newAgents = await this.database.getAllAgents();
                this.populateAgentsMap(newAgents);
            } else {
                this.populateAgentsMap(dbAgents);
            }
            
            Logger.info(`Loaded ${this.agents.size} agents from database`);
        } catch (error) {
            Logger.error('Error loading agents from database:', error as Error);
            throw error;
        }
    }

    private populateAgentsMap(dbAgents: DatabaseAgent[]): void {
        this.agents.clear();
        for (const dbAgent of dbAgents) {
            const agent: Agent = {
                id: dbAgent.id,
                name: dbAgent.name,
                description: dbAgent.description,
                emoji: dbAgent.emoji,
                enabled: dbAgent.enabled,
                specializations: dbAgent.specializations,
                color: dbAgent.color,
                isCustom: dbAgent.isCustom,
                prompt: dbAgent.prompt
            };
            this.agents.set(agent.id, agent);
        }
    }

    private async notifyListeners(): Promise<void> {
        const status = this.getAgentStatus();
        this.listeners.forEach(listener => listener(status));
    }

    // ===== PUBLIC METHODS =====

    getActiveAgents(): Agent[] {
        this.ensureInitialized();
        return Array.from(this.agents.values()).filter(agent => agent.enabled);
    }

    getAllAgents(): Agent[] {
        this.ensureInitialized();
        return Array.from(this.agents.values());
    }

    getAgent(agentId: string): Agent | undefined {
        this.ensureInitialized();
        return this.agents.get(agentId);
    }

    async toggleAgent(agentId: string): Promise<boolean> {
        this.ensureInitialized();
        
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }

        const newEnabledState = !agent.enabled;
        
        // Update in database
        await this.database.updateAgent(agentId, { enabled: newEnabledState });
        
        // Update in memory
        agent.enabled = newEnabledState;
        
        await this.notifyListeners();
        Logger.info(`Agent ${agent.name} ${newEnabledState ? 'enabled' : 'disabled'}`);
        return newEnabledState;
    }

    async setCollaborationMode(mode: 'individual' | 'collaborative' | 'hierarchical'): Promise<void> {
        this.collaborationMode = mode;
        await this.notifyListeners();
        Logger.info(`Collaboration mode set to: ${mode}`);
    }

    getAgentState(): AgentState {
        this.ensureInitialized();
        return {
            agents: new Map(this.agents),
            collaborationMode: this.collaborationMode
        };
    }

    getAgentStatus(): AgentStatus {
        this.ensureInitialized();
        const activeAgents = this.getActiveAgents();
        return {
            totalAgents: this.agents.size,
            activeAgents: activeAgents.length,
            collaborationMode: this.collaborationMode,
            lastUpdated: new Date()
        };
    }

    // ===== CRUD METHODS FOR DYNAMIC AGENTS =====

    async addAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
        this.ensureInitialized();
        
        const dbAgentData: Omit<DatabaseAgent, 'id'> = {
            name: agentData.name,
            description: agentData.description,
            emoji: agentData.emoji,
            specializations: agentData.specializations,
            color: agentData.color,
            enabled: agentData.enabled,
            isCustom: agentData.isCustom,
            prompt: agentData.prompt
        };

        const dbAgent = await this.database.addAgent(dbAgentData);
        
        const agent: Agent = {
            id: dbAgent.id,
            name: dbAgent.name,
            description: dbAgent.description,
            emoji: dbAgent.emoji,
            enabled: dbAgent.enabled,
            specializations: dbAgent.specializations,
            color: dbAgent.color,
            isCustom: dbAgent.isCustom,
            prompt: dbAgent.prompt
        };

        this.agents.set(agent.id, agent);
        await this.notifyListeners();
        
        Logger.info(`Agent added: ${agent.name}`);
        return agent;
    }

    async updateAgent(agentId: string, updates: Partial<Omit<Agent, 'id'>>): Promise<void> {
        this.ensureInitialized();
        
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }

        // Update in database
        const dbUpdates: Partial<Omit<DatabaseAgent, 'id'>> = {
            name: updates.name,
            description: updates.description,
            emoji: updates.emoji,
            specializations: updates.specializations,
            color: updates.color,
            enabled: updates.enabled,
            isCustom: updates.isCustom,
            prompt: updates.prompt
        };

        await this.database.updateAgent(agentId, dbUpdates);

        // Update in memory
        Object.assign(agent, updates);
        
        await this.notifyListeners();
        Logger.info(`Agent updated: ${agent.name}`);
    }

    async deleteAgent(agentId: string): Promise<void> {
        this.ensureInitialized();
        
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }

        if (!agent.isCustom) {
            throw new Error(`Cannot delete standard agent: ${agent.name}`);
        }

        // Delete from database
        await this.database.deleteAgent(agentId);
        
        // Remove from memory
        this.agents.delete(agentId);
        
        await this.notifyListeners();
        Logger.info(`Agent deleted: ${agent.name}`);
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('AgentManager not initialized. Call initialize() first.');
        }
    }

    subscribe(listener: (status: AgentStatus) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    dispose(): void {
        this.listeners.clear();
        Logger.info('Agent Manager disposed');
    }
}