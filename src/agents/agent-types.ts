export type AgentType = 'architect' | 'backend' | 'frontend';

export interface Agent {
    id: AgentType;
    name: string;
    description: string;
    emoji: string;
    enabled: boolean;
    specializations: string[];
    color: string;
}

export interface AgentState {
    architect: Agent;
    backend: Agent;
    frontend: Agent;
    collaborationMode: 'individual' | 'collaborative' | 'hierarchical';
}

export interface AgentStatus {
    totalAgents: number;
    activeAgents: number;
    collaborationMode: string;
    lastUpdated: Date;
}