import { Agent, AgentState, AgentType, AgentStatus } from './agent-types';
import { ConfigStore } from '../core/config-store';
import { Logger } from '../utils/logger';

export class AgentManager {
    private agents: AgentState;
    private listeners: Set<(status: AgentStatus) => void> = new Set();

    constructor(private configStore: ConfigStore) {
        this.agents = this.getDefaultAgents();
        this.loadAgentState();
        Logger.info('Agent Manager initialized');
    }

    private getDefaultAgents(): AgentState {
        return {
            architect: {
                id: 'architect',
                name: 'Architect',
                description: 'System design and architecture decisions',
                emoji: '🏗️',
                enabled: true,
                specializations: ['System Design', 'Architecture Patterns', 'Scalability', 'Technical Decisions'],
                color: '#FF6B35'
            },
            backend: {
                id: 'backend',
                name: 'Backend',
                description: 'Server-side development and APIs',
                emoji: '⚙️',
                enabled: true,
                specializations: ['REST APIs', 'Database Design', 'Authentication', 'Performance'],
                color: '#4ECDC4'
            },
            frontend: {
                id: 'frontend',
                name: 'Frontend',
                description: 'User interface and experience',
                emoji: '🎨',
                enabled: true,
                specializations: ['React/Vue', 'UI/UX Design', 'Responsive Design', 'Accessibility'],
                color: '#45B7D1'
            },
            collaborationMode: 'collaborative'
        };
    }

    private async loadAgentState(): Promise<void> {
        try {
            const config = this.configStore.getConfig();
            // In future iterations, we'll load agent state from config
            // For now, we'll use defaults
            Logger.debug('Agent state loaded from configuration');
        } catch (error) {
            Logger.error('Error loading agent state:', error as Error);
        }
    }

    private async saveAgentState(): Promise<void> {
        try {
            // In future iterations, we'll save to ConfigStore
            // For now, just log the change
            const activeAgents = this.getActiveAgents();
            Logger.info(`Agent state updated: ${activeAgents.map(a => a.name).join(', ')} active`);
            this.notifyListeners();
        } catch (error) {
            Logger.error('Error saving agent state:', error as Error);
        }
    }

    getActiveAgents(): Agent[] {
        return Object.values(this.agents)
            .filter(agent => typeof agent === 'object' && 'enabled' in agent && agent.enabled) as Agent[];
    }

    getAllAgents(): Agent[] {
        return Object.values(this.agents)
            .filter(agent => typeof agent === 'object' && 'enabled' in agent) as Agent[];
    }

    getAgent(agentId: AgentType): Agent | undefined {
        return this.agents[agentId];
    }

    async toggleAgent(agentId: AgentType): Promise<boolean> {
        if (this.agents[agentId] && 'enabled' in this.agents[agentId]) {
            const agent = this.agents[agentId] as Agent;
            agent.enabled = !agent.enabled;
            await this.saveAgentState();
            Logger.info(`Agent ${agentId} ${agent.enabled ? 'enabled' : 'disabled'}`);
            return agent.enabled;
        }
        return false;
    }

    async setCollaborationMode(mode: 'individual' | 'collaborative' | 'hierarchical'): Promise<void> {
        this.agents.collaborationMode = mode;
        await this.saveAgentState();
        Logger.info(`Collaboration mode set to: ${mode}`);
    }

    getAgentState(): AgentState {
        return { ...this.agents };
    }

    getAgentStatus(): AgentStatus {
        const activeAgents = this.getActiveAgents();
        return {
            totalAgents: 3,
            activeAgents: activeAgents.length,
            collaborationMode: this.agents.collaborationMode,
            lastUpdated: new Date()
        };
    }

    subscribe(listener: (status: AgentStatus) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const status = this.getAgentStatus();
        this.listeners.forEach(listener => listener(status));
    }

    dispose(): void {
        this.listeners.clear();
        Logger.info('Agent Manager disposed');
    }
}