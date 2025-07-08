import { createStore } from 'solid-js/store';
import { createMemo } from 'solid-js';
import type { ContextEntry, DatabaseAgent, DatabaseConfig, DatabaseStats } from '../../../core/database/types';
import type { SimpleTokenUsage } from '../../../core/simple-token-monitor';
import type { AppConfig } from '../../../core/config-store';

// 1. Define the shape of our state
interface AppState {
  data: {
    contexts: ContextEntry[];
    agents: DatabaseAgent[];
    searchResults: ContextEntry[];
  };
  ui: {
    isLoading: boolean;
    activeTab: 'general' | 'agents' | 'search' | 'settings';
    errorMessage: string | null;
    successMessage: string | null;
    selectedAgentId: string | null;
    searchPagination: {
      currentPage: number;
      pageSize: number;
      hasMore: boolean;
      isLoadingMore: boolean;
      totalLoaded: number;
    };
  };
  session: {
    onboardingCompleted: boolean;
    mcpStatus: {
      connected: boolean;
      status: string;
    };
    databaseConfig: DatabaseConfig;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    tokenUsage: SimpleTokenUsage | null;
    config: AppConfig | null;
  };
}

// 2. Create the store with an initial state
// This is the single source of truth for the entire frontend application.
const [state, setState] = createStore<AppState>({
  data: {
    contexts: [],
    agents: [],
    searchResults: [],
  },
  ui: {
    isLoading: true,
    activeTab: 'general',
    errorMessage: null,
    successMessage: null,
    selectedAgentId: null,
    searchPagination: {
      currentPage: 0,
      pageSize: 1000,
      hasMore: true,
      isLoadingMore: false,
      totalLoaded: 0,
    },
  },
  session: {
    onboardingCompleted: false,
    mcpStatus: { connected: false, status: 'Server not started' },
    databaseConfig: { type: 'json', json: { path: '', maxContexts: 0 } },
    connectionStatus: 'connecting',
    tokenUsage: null,
    config: null,
  },
});

// 3. Define and export actions to modify the state
// This is the ONLY way the state should be changed. No component
// should ever call `setState` directly.
export const actions = {
  // UI Actions
  setLoading: (isLoading: boolean) => setState('ui', 'isLoading', isLoading),
  setActiveTab: (tab: AppState['ui']['activeTab']) => setState('ui', 'activeTab', tab),
  setError: (message: string | null) => {
    setState('ui', 'errorMessage', message);
    if (message) {
      setState('ui', 'successMessage', null);
    }
  },
  setSuccess: (message: string | null) => {
    setState('ui', 'successMessage', message);
    if (message) {
      setState('ui', 'errorMessage', null);
    }
  },
  selectAgent: (agentId: string | null) => setState('ui', 'selectedAgentId', agentId),

  // Data Actions
  loadContexts: (contexts: ContextEntry[]) => setState('data', 'contexts', contexts),
  loadAgents: (agents: DatabaseAgent[]) => setState('data', 'agents', agents),
  setSearchResults: (results: ContextEntry[]) => setState('data', 'searchResults', results),
  appendSearchResults: (results: ContextEntry[]) => {
    setState('data', 'searchResults', (current) => [...current, ...results]);
  },
  resetSearchResults: () => {
    setState('data', 'searchResults', []);
    setState('ui', 'searchPagination', {
      currentPage: 0,
      pageSize: 1000,
      hasMore: true,
      isLoadingMore: false,
      totalLoaded: 0,
    });
  },

  // Search Pagination Actions
  setLoadingMore: (isLoading: boolean) => setState('ui', 'searchPagination', 'isLoadingMore', isLoading),
  incrementSearchPage: () => setState('ui', 'searchPagination', 'currentPage', (page) => page + 1),
  setHasMore: (hasMore: boolean) => setState('ui', 'searchPagination', 'hasMore', hasMore),
  updateTotalLoaded: (count: number) => setState('ui', 'searchPagination', 'totalLoaded', count),

  // Granular Context Actions (for efficient updates)
  addContext: (context: ContextEntry) => {
    setState('data', 'contexts', (contexts) => [...contexts, context]);
  },
  updateContext: (updatedContext: ContextEntry) => {
    setState('data', 'contexts', (contexts) => 
      contexts.map(c => c.id === updatedContext.id ? updatedContext : c)
    );
  },
  removeContext: (contextId: string) => {
    setState('data', 'contexts', (contexts) => 
      contexts.filter(c => c.id !== contextId)
    );
  },

  // Granular Agent Actions
  addAgent: (agent: DatabaseAgent) => {
    setState('data', 'agents', (agents) => [...agents, agent]);
  },
  updateAgent: (updatedAgent: DatabaseAgent) => {
    setState('data', 'agents', (agents) => 
      agents.map(a => a.id === updatedAgent.id ? updatedAgent : a)
    );
  },
  removeAgent: (agentId: string) => {
    setState('data', 'agents', (agents) => 
      agents.filter(a => a.id !== agentId)
    );
  },
  toggleAgent: (agentId: string) => {
    setState('data', 'agents', (agents) => 
      agents.map(a => a.id === agentId ? { ...a, enabled: !a.enabled } : a)
    );
  },

  // Session Actions
  setOnboardingCompleted: (completed: boolean) => setState('session', 'onboardingCompleted', completed),
  setMcpStatus: (status: AppState['session']['mcpStatus']) => setState('session', 'mcpStatus', status),
  setDatabaseConfig: (config: DatabaseConfig) => setState('session', 'databaseConfig', config),
  setConnectionStatus: (status: AppState['session']['connectionStatus']) => setState('session', 'connectionStatus', status),
  setTokenUsage: (usage: SimpleTokenUsage | null) => setState('session', 'tokenUsage', usage),
  setConfig: (config: AppConfig) => setState('session', 'config', config),
  setStats: (stats: DatabaseStats) => {
    // Stats are derived from contexts data via computed.stats
    // This method exists for compatibility with initial data load from backend
    // The backend sends stats, but we don't store them - we compute them client-side
    // This ensures stats are always in sync with the actual contexts data
    
    // We intentionally don't store the stats because:
    // 1. They're calculated from contexts data in computed.stats
    // 2. This prevents data duplication and sync issues
    // 3. The frontend always shows fresh, accurate stats based on current contexts
  },

  // Complex Action Example
  resetForReload: () => {
    // Reset all UI state to defaults
    setState('ui', {
      isLoading: true,
      activeTab: 'general',
      errorMessage: null,
      successMessage: null,
      selectedAgentId: null,
      searchPagination: {
        currentPage: 0,
        pageSize: 1000,
        hasMore: true,
        isLoadingMore: false,
        totalLoaded: 0,
      },
    });
    // Clear data
    setState('data', {
      contexts: [],
      agents: [],
      searchResults: []
    });
    // Reset session state to initial values
    setState('session', {
      onboardingCompleted: false,
      mcpStatus: { connected: false, status: 'Server not started' },
      databaseConfig: { type: 'json', json: { path: '', maxContexts: 0 } },
      connectionStatus: 'connecting',
      tokenUsage: null,
      config: null,
    });
  }
};

// 4. Export readonly state and computed memos (selectors)
// Components will use these to reactively read data from the store.
export const store = state;

export const computed = {
  stats: createMemo((): DatabaseStats => {
    const contexts = state.data?.contexts || []; // Defensive check for state.data
    const byType: Record<string, number> = {};
    contexts.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    return {
      totalContexts: contexts.length,
      byType,
      byProject: {}, // Note: byProject logic would need to be implemented here
      adapterType: state.session.databaseConfig.type,
    };
  }),
  selectedAgent: createMemo(() => {
    const agentId = state.ui.selectedAgentId;
    if (!agentId) return null;
    return state.data.agents.find(a => a.id === agentId) || null;
  }),
};
