import { AgentManager } from '../../agents/agent-manager';
import { Agent, AgentStatus } from '../../agents/agent-types';
import { Logger } from '../../utils/logger';

export class AgentViewActions {
    constructor(private agentManager: AgentManager) {}

    async getAgents(): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error getting agents:', error as Error);
            throw error;
        }
    }

    async toggleAgent(agentId: string): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            await this.agentManager.toggleAgent(agentId);
            
            // Return updated data
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error toggling agent:', error as Error);
            throw error;
        }
    }

    async setCollaborationMode(mode: 'individual' | 'collaborative' | 'hierarchical'): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            await this.agentManager.setCollaborationMode(mode);
            
            // Return updated data
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error setting collaboration mode:', error as Error);
            throw error;
        }
    }

    // ===== CRUD METHODS FOR DYNAMIC AGENTS =====

    async addAgent(agentData: Omit<Agent, 'id'>): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            await this.agentManager.addAgent(agentData);
            
            // Return updated data
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error adding agent:', error as Error);
            throw error;
        }
    }

    async updateAgent(agentId: string, updates: Partial<Omit<Agent, 'id'>>): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            await this.agentManager.updateAgent(agentId, updates);
            
            // Return updated data
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error updating agent:', error as Error);
            throw error;
        }
    }

    async deleteAgent(agentId: string): Promise<{ agents: Agent[], status: AgentStatus }> {
        try {
            await this.agentManager.deleteAgent(agentId);
            
            // Return updated data
            const agents = this.agentManager.getAllAgents();
            const status = this.agentManager.getAgentStatus();
            return { agents, status };
        } catch (error) {
            Logger.error('Error deleting agent:', error as Error);
            throw error;
        }
    }
}