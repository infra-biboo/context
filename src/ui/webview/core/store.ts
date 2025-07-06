import { createSignal } from 'solid-js';
import { DatabaseConfig, ContextEntry, DatabaseAgent, DatabaseStats } from '../../../core/database/types';

// Database configuration state
export const [databaseConfig, setDatabaseConfig] = createSignal<DatabaseConfig>({
  type: 'json',
  json: { path: './context.json', maxContexts: 1000 }
});

// Data state
export const [contexts, setContexts] = createSignal<ContextEntry[]>([]);
export const [agents, setAgents] = createSignal<DatabaseAgent[]>([]);
export const [stats, setStats] = createSignal<DatabaseStats>({
  totalContexts: 0,
  byType: {},
  byProject: {},
  adapterType: 'json'
});

// Connection state
export const [connectionStatus, setConnectionStatus] = createSignal<'connected' | 'disconnected' | 'connecting'>('connected');

// UI state
export const [isLoading, setIsLoading] = createSignal(false);
export const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
export const [searchResults, setSearchResults] = createSignal<ContextEntry[]>([]);
export const [selectedAgent, setSelectedAgent] = createSignal<DatabaseAgent | null>(null);

// MCP Server state
export const [mcpStatus, setMcpStatus] = createSignal<{ connected: boolean; status: string }>({
  connected: false,
  status: 'Not started'
});

// Computed values with safety checks
export const contextsByType = () => {
  const ctxs = contexts();
  if (!Array.isArray(ctxs)) return {};
  
  return ctxs.reduce((acc, ctx) => {
    if (ctx && ctx.type) {
      acc[ctx.type] = (acc[ctx.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
};

export const store = {
  // Database config
  databaseConfig,
  setDatabaseConfig,
  
  // Data
  contexts,
  setContexts,
  agents,
  setAgents,
  stats,
  setStats,
  
  // Connection
  connectionStatus,
  setConnectionStatus,
  
  // UI
  isLoading,
  setIsLoading,
  errorMessage,
  setErrorMessage,
  searchResults,
  setSearchResults,
  selectedAgent,
  setSelectedAgent,
  
  // MCP
  mcpStatus,
  setMcpStatus,
  
  // Computed
  contextsByType
};