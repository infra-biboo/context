export type AgentType = string; // Changed to be more flexible

export interface Agent {
    id: string; // Changed from AgentType to string for dynamic IDs
    name: string;
    description: string;
    emoji?: string; // Made optional
    enabled: boolean;
    specializations: string[];
    color?: string; // Made optional
    isCustom: boolean; // Added to distinguish standard vs custom agents
    prompt?: string; // Added for future extensibility
}

export interface AgentState {
    agents: Map<string, Agent>; // Changed to dynamic structure
    collaborationMode: 'individual' | 'collaborative' | 'hierarchical';
}

export interface AgentStatus {
    totalAgents: number;
    activeAgents: number;
    collaborationMode: string;
    lastUpdated: Date;
}