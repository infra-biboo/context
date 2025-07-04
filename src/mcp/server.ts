import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';

export class MCPServer {
    private server: McpServer;
    private isRunning: boolean = false;

    constructor(
        private database: ContextDatabase,
        private agentManager: AgentManager
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
    }

    private async handleGetContext(args: any) {
        const limit = args.limit || 10;
        const type = args.type;

        const contexts = await this.database.getContexts();
        const filtered = type 
            ? contexts.filter(c => c.type === type)
            : contexts;

        const limited = filtered.slice(0, limit);

        const contextSummary = limited.map(ctx => ({
            type: ctx.type,
            content: ctx.content,
            timestamp: ctx.timestamp,
            importance: ctx.importance,
            tags: ctx.tags
        }));

        return {
            content: [{
                type: 'text' as const,
                text: `Recent Context (${limited.length} entries):\n\n` +
                      contextSummary.map(ctx => 
                          `[${ctx.type.toUpperCase()}] ${ctx.content.substring(0, 200)}...\n` +
                          `Tags: ${ctx.tags.join(', ')}\n` +
                          `Importance: ${ctx.importance}/10\n`
                      ).join('\n---\n')
            }]
        };
    }

    private async handleGetActiveAgents() {
        const activeAgents = this.agentManager.getActiveAgents();
        const agentInfo = activeAgents.map(agent => ({
            name: agent.name,
            role: agent.description,
            specializations: agent.specializations
        }));

        return {
            content: [{
                type: 'text' as const,
                text: `Active AI Agents (${activeAgents.length}):\n\n` +
                      agentInfo.map(agent => 
                          `**${agent.name}**: ${agent.role}\n` +
                          `Specializations: ${agent.specializations.join(', ')}\n`
                      ).join('\n')
            }]
        };
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
            throw error;
        }
    }

    isConnected(): boolean {
        return this.isRunning;
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        // Note: SDK doesn't provide explicit stop method
        // This is a placeholder for cleanup
        this.isRunning = false;
        console.log('MCP Server stopped');
    }
}