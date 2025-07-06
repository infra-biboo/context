import { ContextViewActions } from './context-view-actions';
import { AgentViewActions } from './agent-view-actions';
import { ConfigViewActions } from './config-view-actions';
import { McpViewActions } from './mcp-view-actions';
import { Logger } from '../../utils/logger';

export class ActionDispatcher {
    constructor(
        private contextActions: ContextViewActions,
        private agentActions: AgentViewActions,
        private configActions: ConfigViewActions,
        private mcpActions: McpViewActions
    ) {}

    async dispatch(type: string, payload?: any): Promise<any> {
        try {
            Logger.debug(`Dispatching action: ${type} with payload: ${JSON.stringify(payload)}`);

            switch (type) {
                // SolidJS specific actions
                case 'request-initial-data':
                    // This is handled in the webview provider, just return success
                    return { success: true };
                
                case 'update-database-config':
                    // Database configuration update - for now just return success
                    return { success: true, config: payload.config };
                
                case 'test-database-connection':
                    // Database connection test - for now just return success
                    return { success: true, connected: true };
                
                case 'search-contexts':
                    return await this.contextActions.searchContexts(payload.query, payload.options);
                
                case 'delete-context':
                    return await this.contextActions.deleteContext(payload.id);
                
                case 'save-agent':
                    if (payload.agent.id) {
                        return await this.agentActions.updateAgent(payload.agent.id, payload.agent);
                    } else {
                        return await this.agentActions.addAgent(payload.agent);
                    }
                
                case 'delete-agent':
                    return await this.agentActions.deleteAgent(payload.id);

                // Context actions
                case 'getContexts':
                    return await this.contextActions.getContexts();
                
                case 'searchContexts':
                    return await this.contextActions.searchContexts(payload.query, payload.filters);
                
                case 'editContext':
                    return await this.contextActions.getContextById(payload.contextId);
                
                case 'updateContext':
                    return await this.contextActions.updateContext(payload.contextId, payload.updates);
                
                case 'deleteContext':
                    return await this.contextActions.deleteContext(payload.contextId);
                
                case 'deleteMultipleContexts':
                    return await this.contextActions.deleteMultipleContexts(payload.contextIds);

                // Agent actions
                case 'getAgents':
                    return await this.agentActions.getAgents();
                
                case 'toggleAgent':
                    return await this.agentActions.toggleAgent(payload.agentId);
                
                case 'setCollaborationMode':
                    return await this.agentActions.setCollaborationMode(payload.mode);
                
                case 'addAgent':
                    return await this.agentActions.addAgent(payload.agentData);
                
                case 'updateAgent':
                    return await this.agentActions.updateAgent(payload.agentId, payload.updates);
                
                case 'deleteAgent':
                    return await this.agentActions.deleteAgent(payload.agentId);

                // Config actions
                case 'getConfig':
                    return await this.configActions.getConfig();
                
                case 'toggleGitCapture':
                    return await this.configActions.toggleGitCapture();
                
                case 'toggleFileCapture':
                    return await this.configActions.toggleFileCapture();
                
                case 'addTestContext':
                    return await this.configActions.addTestContext();

                // MCP actions
                case 'generateMCPConfig':
                    return await this.mcpActions.generateMCPConfig();
                
                case 'testMCPConnection':
                    return await this.mcpActions.testMCPConnection();
                
                case 'getMCPStatus':
                    return await this.mcpActions.getMCPStatus();
                
                case 'start-mcp-server':
                    return await this.mcpActions.startMCPServer();
                
                case 'stop-mcp-server':
                    return await this.mcpActions.stopMCPServer();

                default:
                    Logger.warn(`Unknown action type: ${type}`);
                    throw new Error(`Unknown action type: ${type}`);
            }
        } catch (error) {
            Logger.error(`Error dispatching action ${type}:`, error as Error);
            throw error;
        }
    }
}