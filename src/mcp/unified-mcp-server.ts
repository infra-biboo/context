import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as vscode from 'vscode';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';
import { ContextAnalysisService } from '../core/context-analysis-service';
import { ResponseFormattingService } from './response-formatting-service';
import { CascadeEnrichmentService } from './cascade-enrichment-service';
import { Logger } from '../utils/logger';

/**
 * Unified MCP Server - The single MCP server for Context Manager
 * 
 * This server replaces:
 * - mcp-server.ts (deprecated)
 * - mcp-server-standalone.ts (wrapper)
 * - mcp-bridge.ts (broken)
 * 
 * Features:
 * - Real MCP protocol implementation with SDK
 * - Cascade enrichment (Claude → API → Local)
 * - Hybrid architecture (works with or without VS Code)
 * - Unified configuration and management
 */
export class UnifiedMCPServer {
    private server: McpServer;
    private transport: StdioServerTransport;
    private enrichmentService: CascadeEnrichmentService;
    private isRunning: boolean = false;

    constructor(
        private database: ContextDatabase,
        private agentManager: AgentManager,
        private extensionContext: vscode.ExtensionContext,
        private analysisService: ContextAnalysisService = new ContextAnalysisService(),
        private formattingService: ResponseFormattingService = new ResponseFormattingService()
    ) {
        this.server = new McpServer({
            name: 'claude-context-manager',
            version: '1.0.0',
        });

        this.transport = new StdioServerTransport();
        this.enrichmentService = new CascadeEnrichmentService(extensionContext);
        this.setupTools();
    }

    private setupTools(): void {
        // Primary tool: Get project context
        this.server.registerTool(
            'get_context',
            {
                title: 'Get Project Context',
                description: 'Get recent context entries for the current project',
                inputSchema: {
                    limit: z.number().optional().describe('Number of entries (default: 10)'),
                    type: z.enum(['conversation', 'decision', 'code', 'issue']).optional().describe('Context type filter')
                }
            },
            async ({ limit = 10, type }) => {
                return await this.handleGetContext({ limit, type });
            }
        );

        // Enrichment tool with cascade strategy
        this.server.registerTool(
            'enrich_context',
            {
                title: 'Enrich Context',
                description: 'Enrich context using cascade strategy (Claude → API → Local)',
                inputSchema: {
                    content: z.string().describe('Content to enrich'),
                    importance: z.number().describe('Importance level 1-10')
                }
            },
            async ({ content, importance }) => {
                const enriched = await this.enrichmentService.enrichContext(content, importance);
                return {
                    content: [{
                        type: 'text',
                        text: enriched
                    }]
                };
            }
        );

        // Add context tool (allows Claude Desktop to add context)
        this.server.registerTool(
            'add_context',
            {
                title: 'Add Context Entry',
                description: 'Add new context entry from Claude Desktop',
                inputSchema: {
                    content: z.string().describe('Context content'),
                    type: z.enum(['conversation', 'decision', 'code', 'issue']).describe('Context type'),
                    importance: z.number().optional().describe('Importance level 1-10 (default: 5)')
                }
            },
            async ({ content, type, importance = 5 }) => {
                return await this.handleAddContext({ content, type, importance });
            }
        );

        // Search contexts tool
        this.server.registerTool(
            'search_contexts',
            {
                title: 'Search Contexts',
                description: 'Search context entries by query',
                inputSchema: {
                    query: z.string().describe('Search query'),
                    limit: z.number().optional().describe('Max results (default: 10)')
                }
            },
            async ({ query, limit = 10 }) => {
                return await this.handleSearchContexts({ query, limit });
            }
        );

        // Get agent suggestions tool
        this.server.registerTool(
            'get_agent_suggestions',
            {
                title: 'Get Agent Suggestions',
                description: 'Get AI agent suggestions for current context',
                inputSchema: {
                    context: z.string().describe('Current context or task'),
                    limit: z.number().optional().describe('Max suggestions (default: 3)')
                }
            },
            async ({ context, limit = 3 }) => {
                return await this.handleGetAgentSuggestions({ context, limit });
            }
        );
    }

    private async handleGetContext({ limit, type }: { limit?: number; type?: string }): Promise<any> {
        try {
            const contexts = await this.database.searchContexts('', { type: type as any, limit });
            const formatted = this.formatContextsForMCP(contexts);
            
            return {
                content: [{
                    type: 'text',
                    text: formatted
                }]
            };
        } catch (error) {
            Logger.error('Failed to get context', error);
            return {
                content: [{
                    type: 'text',
                    text: `Error retrieving context: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }

    private async handleAddContext({ content, type, importance }: { content: string; type: string; importance: number }): Promise<any> {
        try {
            // Enrich the content using cascade strategy
            const enrichedContent = await this.enrichmentService.enrichContext(content, importance);
            
            // Add to database
            await this.database.addContext({
                projectPath: this.getWorkspacePath(),
                type: type as any,
                content: enrichedContent,
                importance,
                tags: ['claude-desktop', 'manual-entry']
            });

            return {
                content: [{
                    type: 'text',
                    text: '✅ Context added to VS Code project successfully'
                }]
            };
        } catch (error) {
            Logger.error('Failed to add context', error);
            return {
                content: [{
                    type: 'text',
                    text: `Error adding context: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }

    private async handleSearchContexts({ query, limit }: { query: string; limit: number }): Promise<any> {
        try {
            const contexts = await this.database.searchContexts(query, { limit });
            const formatted = this.formatContextsForMCP(contexts);
            
            return {
                content: [{
                    type: 'text',
                    text: formatted || 'No contexts found matching your query.'
                }]
            };
        } catch (error) {
            Logger.error('Failed to search contexts', error);
            return {
                content: [{
                    type: 'text',
                    text: `Error searching contexts: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }

    private async handleGetAgentSuggestions({ context, limit }: { context: string; limit: number }): Promise<any> {
        try {
            const activeAgents = this.agentManager.getActiveAgents();
            const formatted = this.formatAgentSuggestions(activeAgents);
            
            return {
                content: [{
                    type: 'text',
                    text: formatted
                }]
            };
        } catch (error) {
            Logger.error('Failed to get agent suggestions', error);
            return {
                content: [{
                    type: 'text',
                    text: `Error getting agent suggestions: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }

    private getWorkspacePath(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        return workspaceFolder?.uri.fsPath || process.cwd();
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            Logger.warn('MCP Server is already running');
            return;
        }

        try {
            // Initialize services
            await this.initializeServices();
            
            // Always use stdio transport for MCP compatibility
            // but handle the "already started" error gracefully
            try {
                await this.server.connect(this.transport);
            } catch (error: any) {
                if (error.message?.includes('already started')) {
                    // Transport already connected, that's fine
                    Logger.info('MCP Transport already connected, continuing...');
                } else {
                    throw error;
                }
            }
            
            this.isRunning = true;
            Logger.info('✅ Unified MCP Server started successfully');
            console.log('Context Manager MCP Server ready for Claude Desktop, Cline, and VS Code');
        } catch (error) {
            Logger.error('❌ Failed to start MCP Server', error);
            throw error;
        }
    }

    private async initializeServices(): Promise<void> {
        // Database should already be initialized by the caller
        // We just verify it's ready
        if (!this.database) {
            throw new Error('Database not initialized');
        }
        
        if (!this.agentManager) {
            throw new Error('Agent Manager not initialized');
        }
        
        Logger.info('MCP Server services initialized');
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            Logger.warn('MCP Server is not running');
            return;
        }

        try {
            if (this.transport) {
                await this.transport.close();
            }
            this.isRunning = false;
            Logger.info('Unified MCP Server stopped successfully');
        } catch (error) {
            Logger.error('Error stopping MCP Server', error);
            // Force state reset even if stop fails
            this.isRunning = false;
        }
    }

    public isServerRunning(): boolean {
        return this.isRunning;
    }

    // Method to check if MCP should be enabled
    private formatContextsForMCP(contexts: any[]): string {
        if (contexts.length === 0) {
            return '📋 No contexts found.';
        }
        
        return contexts.map((ctx, index) => {
            return `## Context ${index + 1}
**Type**: ${ctx.type}
**Importance**: ${ctx.importance}/10
**Content**: ${ctx.content}
**Created**: ${ctx.createdAt || 'Unknown'}
**Project**: ${ctx.projectPath || 'Unknown'}
---`;
        }).join('\n');
    }

    private formatAgentSuggestions(agents: any[]): string {
        if (agents.length === 0) {
            return '🤖 No active agents available.';
        }
        
        return agents.map((agent, index) => {
            return `## Agent ${index + 1}: ${agent.name}
**Type**: ${agent.type}
**Status**: ${agent.state}
**Description**: ${agent.description || 'No description'}
---`;
        }).join('\n');
    }

    public static shouldStartMCP(): boolean {
        const config = vscode.workspace.getConfiguration('claude-context');
        return config.get('enableMCP', true);
    }
}