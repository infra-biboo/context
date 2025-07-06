import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';
import { ContextAnalysisService } from '../core/context-analysis-service';
import { ResponseFormattingService } from './response-formatting-service';

// Dynamically import vscode for optional usage
let vscode: any;
try {
    vscode = require('vscode');
} catch (e) {
    vscode = null;
}

export class MCPServer {
    private server: McpServer;
    private isRunning: boolean = false;

    constructor(
        private database: ContextDatabase,
        private agentManager: AgentManager,
        private analysisService: ContextAnalysisService = new ContextAnalysisService(),
        private formattingService: ResponseFormattingService = new ResponseFormattingService()
    ) {
        this.server = new McpServer({
            name: 'claude-context-manager',
            version: '1.0.0',
        });

        this.setupTools();
    }

    private setupTools(): void {
        // Get context tool
        this.server.registerTool(
            'get_context',
            {
                title: 'Get Context',
                description: 'Get recent context for the current project',
                inputSchema: {
                    limit: z.number().optional().describe('Number of context entries to retrieve (default: 10)'),
                    type: z.enum(['conversation', 'decision', 'code', 'issue']).optional().describe('Filter by context type')
                }
            },
            async ({ limit, type }) => {
                return await this.handleGetContext({ limit, type });
            }
        );

        // Get active agents tool
        this.server.registerTool(
            'get_active_agents',
            {
                title: 'Get Active Agents',
                description: 'Get list of currently active agents and their roles',
                inputSchema: {}
            },
            async () => {
                return await this.handleGetActiveAgents();
            }
        );

        // Activate agent context tool
        this.server.registerTool(
            'activate_agent_context',
            {
                title: 'Activate Agent Context',
                description: 'Set active agent perspective for specialized responses',
                inputSchema: {
                    agent: z.enum(['architect', 'backend', 'frontend']).describe('Agent to activate'),
                    task: z.string().describe('Specific task or context for the agent'),
                    priority: z.enum(['primary', 'consulting']).optional().describe('Agent priority level (default: primary)')
                }
            },
            async ({ agent, task, priority }) => {
                return await this.handleActivateAgentContext({ agent, task, priority });
            }
        );

        // Eureka: Save summarized context tool
        this.server.registerTool(
            'save_summarized_context',
            {
                title: 'Save Summarized Context',
                description: 'Saves a pre-summarized text as a new context entry, typically triggered by a keyword.',
                inputSchema: {
                    summary: z.string().describe('The AI-generated summary of the recent conversation.'),
                }
            },
            async ({ summary }) => {
                const projectPath = vscode?.workspace?.workspaceFolders?.[0]?.uri?.fsPath || 'unknown';

                const contextId = await this.database.addContext({
                    projectPath,
                    type: 'decision',
                    content: summary,
                    importance: 7, // Revelations are often important
                    tags: ['eureka-capture', 'ai-summarized']
                });

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Context 'Eureka!' saved successfully (ID: ${contextId}).`
                    }]
                };
            }
        );
    }

    private async handleGetContext(args: any) {
        const limit = args.limit || 10;
        const type = args.type;

        // 1. Get data from database
        const contexts = await this.database.searchContexts('', {
            type: type,
            limit: limit
        });

        // 2. Process with analysis service
        const enrichedContexts = this.analysisService.enrichWithAgentSuggestions(contexts);

        // 3. Format with formatting service
        const formattedResponse = this.formattingService.formatContextResponse(enrichedContexts);

        // 4. Return formatted response
        return formattedResponse;
    }


    private async handleGetActiveAgents() {
        // 1. Get data from agent manager
        const activeAgents = this.agentManager.getActiveAgents();
        const agentStatus = this.agentManager.getAgentStatus();
        
        // 2. Format with formatting service
        const formattedResponse = this.formattingService.formatActiveAgentsResponse(activeAgents, agentStatus);
        
        // 3. Return formatted response
        return formattedResponse;
    }

    private async handleActivateAgentContext(args: any) {
        const { agent, task, priority = 'primary' } = args;
        
        // 1. Get data from agent manager
        const agentInfo = this.agentManager.getAgent(agent);
        if (!agentInfo) {
            throw new Error(`Agent '${agent}' not found or not active`);
        }

        // 2. Format with formatting service
        const formattedResponse = this.formattingService.formatAgentActivationResponse(agentInfo, task, priority);
        
        // 3. Return formatted response
        return formattedResponse;
    }

    async start(): Promise<void> {
        if (this.isRunning) return;

        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            this.isRunning = true;
            console.log('MCP Server started successfully');
        } catch (error) {
            console.error('Failed to start MCP server:', error);
            this.isRunning = false;
            throw error;
        }
    }

    isConnected(): boolean {
        return this.isRunning && this.server !== null;
    }

    getConnectionInfo(): { connected: boolean; status: string } {
        if (!this.isRunning) {
            return { connected: false, status: 'Server not started' };
        }
        
        try {
            // Additional health check could be added here
            return { connected: true, status: 'Connected and ready' };
        } catch (error) {
            return { connected: false, status: `Connection error: ${error}` };
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        // Note: SDK doesn't provide explicit stop method
        // This is a placeholder for cleanup
        this.isRunning = false;
        console.log('MCP Server stopped');
    }
}
