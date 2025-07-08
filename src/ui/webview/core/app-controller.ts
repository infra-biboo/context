import { createEffect } from 'solid-js';
import { bridge } from './vscode-bridge';
import { store, actions } from './store';
import type { DatabaseConfig } from '../../../core/database/types';
import type { ContextEntry, DatabaseAgent } from '../../../core/database/types';
import type { CollaborationMode, WebviewResponse, WebviewCommands } from './types';

/**
 * The AppController is the central orchestrator for the frontend application.
 * It uses the new WebviewRequest/WebviewResponse protocol for efficient,
 * granular state updates and better error handling.
 */
class AppController {
    private static instance: AppController;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): AppController {
        if (!AppController.instance) {
            AppController.instance = new AppController();
        }
        return AppController.instance;
    }

    /**
     * Initializes the controller, setting up the listener for unsolicited responses from the backend.
     * This should only be called once when the application starts.
     */
    public initialize() {
        if (this.isInitialized) {
            return;
        }

        const [responseSignal] = bridge.onResponse();

        createEffect(() => {
            const response = responseSignal();
            if (!response) return;

            // Handle unsolicited messages (like token updates)
            this.handleUnsolicitedResponse(response);
        });

        this.requestInitialData();
        this.isInitialized = true;
    }

    /**
     * Handles unsolicited responses from the backend (e.g., token updates)
     */
    private handleUnsolicitedResponse(response: WebviewResponse) {
        // Only handle truly unsolicited messages (without requestId or with specific event types)
        if (!response.requestId || response.requestId === 'token-monitor' || response.command.startsWith('event.')) {
            switch (response.command) {
                case 'token.usageUpdated':
                    actions.setTokenUsage(response.payload.usage);
                    break;
                default:
                    // Only warn about truly unexpected messages
                    if (!response.requestId) {
                        console.warn('Received unexpected unsolicited response:', response);
                    }
            }
        }
        // Ignore other messages as they are handled by the bridge's promise resolution
    }

    // --- Methods to be called by the UI ---

    public async requestInitialData() {
        actions.setLoading(true);
        try {
            const data = await bridge.sendRequest('app.requestInitialData', {});
            
            // Update all the initial state
            actions.loadContexts(data.contexts);
            actions.loadAgents(data.agents);
            actions.setDatabaseConfig(data.databaseConfig);
            actions.setMcpStatus(data.mcpStatus);
            actions.setTokenUsage(data.tokenUsage);
            actions.setStats(data.stats);
            if (data.config) {
                actions.setConfig(data.config);
            }
            
            // Check onboarding status from localStorage
            const onboardingCompleted = localStorage.getItem('claude-context-onboarding-completed') === 'true';
            actions.setOnboardingCompleted(onboardingCompleted);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to load initial data');
        } finally {
            actions.setLoading(false);
        }
    }

    public async searchContexts(query: string) {
        actions.setLoading(true);
        try {
            const results = await bridge.sendRequest('context.search', { query });
            actions.setSearchResults(results);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Search failed');
        } finally {
            actions.setLoading(false);
        }
    }

    public async searchContextsPaginated(query: string, options: { limit: number; offset: number }) {
        try {
            const results = await bridge.sendRequest('context.search', { 
                query, 
                limit: options.limit, 
                offset: options.offset 
            });
            return results;
        } catch (error) {
            console.error('Paginated search failed:', error);
            throw error;
        }
    }

    public async deleteContext(contextId: string) {
        try {
            const result = await bridge.sendRequest('context.delete', { id: contextId });
            // Granular update: remove just this context
            actions.removeContext(result.id);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to delete context');
        }
    }

    public async updateContext(contextId: string, updates: Partial<ContextEntry>) {
        try {
            const updatedContext = await bridge.sendRequest('context.update', { contextId, updates });
            // Granular update: update just this context
            actions.updateContext(updatedContext);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to update context');
        }
    }
    
    public async createCustomContext(contextData: Omit<ContextEntry, 'id' | 'timestamp'>) {
        try {
            const newContext = await bridge.sendRequest('context.create', { contextData });
            // Granular update: add just this context
            actions.addContext(newContext);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to create context');
        }
    }

    public async saveAgent(agent: DatabaseAgent) {
        try {
            const savedAgent = await bridge.sendRequest('agent.save', { agent });
            // Granular update: add or update just this agent
            if (agent.id) {
                actions.updateAgent(savedAgent);
            } else {
                actions.addAgent(savedAgent);
            }
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to save agent');
        }
    }

    public async deleteAgent(agentId: string) {
        try {
            const result = await bridge.sendRequest('agent.delete', { id: agentId });
            // Granular update: remove just this agent
            actions.removeAgent(result.id);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to delete agent');
        }
    }

    public async updateDatabaseConfig(config: DatabaseConfig) {
        actions.setLoading(true);
        try {
            const updatedConfig = await bridge.sendRequest('config.updateDatabase', { config });
            actions.setDatabaseConfig(updatedConfig);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to update database config');
        } finally {
            actions.setLoading(false);
        }
    }

    public async startMcpServer() {
        actions.setLoading(true);
        try {
            const status = await bridge.sendRequest('mcp.start', {});
            actions.setMcpStatus(status);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to start MCP server');
        } finally {
            actions.setLoading(false);
        }
    }

    public async stopMcpServer() {
        actions.setLoading(true);
        try {
            const status = await bridge.sendRequest('mcp.stop', {});
            actions.setMcpStatus(status);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to stop MCP server');
        } finally {
            actions.setLoading(false);
        }
    }

    public async resetConfig() {
        try {
            actions.setLoading(true);
            
            // Paso 1: Detener servidor MCP si está corriendo
            try {
                if (store.session?.mcpStatus?.connected) {
                    console.log('Stopping MCP server before reset...');
                    await this.stopMcpServer();
                }
            } catch (mcpError) {
                console.warn('Failed to stop MCP server during reset:', mcpError);
                // Continuar con el reset aunque falle
            }
            
            // Paso 2: Limpiar todos los datos del backend
            console.log('Resetting backend configuration and data...');
            const result = await bridge.sendRequest('config.reset', {});
            
            if (result.status === 'reset') {
                // Paso 3: Limpiar TODO el localStorage relacionado
                console.log('Clearing all localStorage data...');
                localStorage.removeItem('claude-context-onboarding-completed');
                localStorage.removeItem('claude-context-onboarding-data');
                localStorage.removeItem('claude-context-onboarding-progress');
                localStorage.removeItem('claude-context-onboarding-collaboration-mode');
                
                // Limpiar cualquier otro dato de la extensión
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('claude-context-')) {
                        localStorage.removeItem(key);
                    }
                });
                
                // Paso 4: Reset completo del store
                actions.resetForReload();
                
                // Paso 5: Activar onboarding en lugar de recargar
                console.log('Launching onboarding after reset...');
                actions.setOnboardingCompleted(false);
                
                // Mostrar mensaje de confirmación
                setTimeout(() => {
                    actions.setSuccess('Configuración reiniciada. Iniciando tutorial de configuración...');
                    setTimeout(() => {
                        actions.setSuccess(null);
                    }, 3000);
                }, 100);
            }
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to reset configuration');
            console.error('Reset failed:', error);
        } finally {
            actions.setLoading(false);
        }
    }

    public async getMcpStatus() {
        try {
            const status = await bridge.getMCPStatus();
            actions.setMcpStatus(status);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to get MCP status');
        }
    }

    public async toggleAgent(agentId: string) {
        try {
            await bridge.toggleAgent(agentId);
            // Granular update: toggle just this agent
            actions.toggleAgent(agentId);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to toggle agent');
        }
    }

    public async setCollaborationMode(mode: CollaborationMode) {
        try {
            const agents = await bridge.sendRequest('agent.setCollaborationMode', { mode });
            // Update agents list after mode change
            actions.loadAgents(agents);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to set collaboration mode');
        }
    }

    public async completeOnboarding() {
        try {
            await bridge.sendRequest('app.completeOnboarding', {});
            actions.setOnboardingCompleted(true);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
        }
    }

    public async toggleGitCapture(enabled: boolean) {
        try {
            const config = await bridge.sendRequest('capture.toggleGit', { enabled });
            actions.setConfig(config);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to toggle git capture');
        }
    }

    public async toggleFileCapture(enabled: boolean) {
        try {
            const config = await bridge.sendRequest('capture.toggleFile', { enabled });
            actions.setConfig(config);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to toggle file capture');
        }
    }

    public async generateClaudeDesktopConfig() {
        actions.setLoading(true);
        try {
            await bridge.sendRequest('config.generateClaudeDesktopConfig', {});
            actions.setSuccess('Claude Desktop configuration generated successfully!');
            setTimeout(() => actions.setSuccess(null), 3000);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to generate Claude Desktop config');
        } finally {
            actions.setLoading(false);
        }
    }

    public async generateClineConfig() {
        actions.setLoading(true);
        try {
            await bridge.sendRequest('config.generateClineConfig', {});
            actions.setSuccess('Cline configuration generated successfully!');
            setTimeout(() => actions.setSuccess(null), 3000);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to generate Cline config');
        } finally {
            actions.setLoading(false);
        }
    }

    public async generateGeminiConfig() {
        actions.setLoading(true);
        try {
            await bridge.sendRequest('config.generateGeminiConfig', {});
            actions.setSuccess('Gemini configuration generated successfully!');
            setTimeout(() => actions.setSuccess(null), 3000);
        } catch (error) {
            actions.setError(error instanceof Error ? error.message : 'Failed to generate Gemini config');
        } finally {
            actions.setLoading(false);
        }
    }

    // Alias for backward compatibility
    public loadContexts() {
        this.requestInitialData();
    }
}

export const appController = AppController.getInstance();
