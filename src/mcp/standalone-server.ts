#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Use require for Node.js built-ins to avoid webpack issues
const fs = require('fs');
const path = require('path');

console.error('🔄 Starting minimal MCP server...');

// Standalone Database implementation
class StandaloneDatabase {
    private dbPath: string;
    private contexts: any[] = [];

    constructor() {
        // Use workspace path from env if available, otherwise use current directory
        const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
        this.dbPath = path.join(workspacePath, '.context-manager', 'contexts.json');
        console.error(`💾 Database path: ${this.dbPath}`);
        console.error(`🔍 Workspace path from env: ${process.env.WORKSPACE_PATH}`);
        console.error(`🔍 Current working directory: ${process.cwd()}`);
        this.loadContexts();
    }

    private loadContexts(): void {
        try {
            console.error(`📁 Checking if file exists: ${this.dbPath}`);
            console.error(`📁 File exists: ${fs.existsSync(this.dbPath)}`);
            
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf8');
                console.error(`📄 File content length: ${data.length} characters`);
                
                const parsed = JSON.parse(data);
                console.error(`🔍 Parsed data type: ${Array.isArray(parsed) ? 'array' : 'object'}`);
                console.error(`🔍 Parsed data keys: ${Object.keys(parsed)}`);
                
                // Handle both formats: array (old) or object with contexts property (new)
                if (Array.isArray(parsed)) {
                    this.contexts = parsed;
                    console.error(`✅ Loaded ${this.contexts.length} contexts from array format`);
                } else if (parsed.contexts && Array.isArray(parsed.contexts)) {
                    this.contexts = parsed.contexts;
                    console.error(`✅ Loaded ${this.contexts.length} contexts from object format`);
                } else {
                    this.contexts = [];
                    console.error(`⚠️ No valid contexts found in data`);
                }
            } else {
                console.error(`❌ File does not exist: ${this.dbPath}`);
                this.contexts = [];
            }
        } catch (error) {
            console.error('Failed to load contexts:', error);
            this.contexts = [];
        }
    }

    private saveContexts(): void {
        try {
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Read existing data to preserve agents and metadata
            let existingData: any = { contexts: [], agents: [], metadata: {} };
            if (fs.existsSync(this.dbPath)) {
                try {
                    const existing = fs.readFileSync(this.dbPath, 'utf8');
                    const parsed = JSON.parse(existing);
                    if (!Array.isArray(parsed)) {
                        existingData = parsed;
                    }
                } catch {
                    // Ignore parse errors, use default structure
                }
            }
            
            // Update contexts and metadata
            existingData.contexts = this.contexts;
            existingData.metadata = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.dbPath, JSON.stringify(existingData, null, 2));
        } catch (error) {
            console.error('Failed to save contexts:', error);
        }
    }

    public addContext(contextData: any): any {
        const newContext = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            projectPath: process.env.WORKSPACE_PATH || process.cwd(),
            ...contextData
        };
        this.contexts.unshift(newContext);
        
        // Keep only last 100 contexts
        if (this.contexts.length > 100) {
            this.contexts = this.contexts.slice(0, 100);
        }
        
        this.saveContexts();
        return newContext;
    }

    public getContexts(limit: number = 10): any[] {
        return this.contexts.slice(0, limit);
    }

    public searchContexts(query: string, limit: number = 10): any[] {
        if (!query) return this.getContexts(limit);
        
        const filtered = this.contexts.filter(context => 
            context.content?.toLowerCase().includes(query.toLowerCase()) ||
            context.type?.toLowerCase().includes(query.toLowerCase())
        );
        
        return filtered.slice(0, limit);
    }
}

// Start the server
async function main() {
    try {
        console.error('🔄 Starting Claude Context Manager MCP Server...');
        console.error(`📁 Workspace: ${process.env.WORKSPACE_PATH || process.cwd()}`);
        
        console.error('✅ Starting server creation...');
        
        const server = new McpServer({
            name: 'context-manager',
            version: '1.0.0',
        });
        
        console.error('✅ Server created');
        
        const transport = new StdioServerTransport();
        const database = new StandaloneDatabase();
        
        console.error('✅ Transport and database created');
        
        // Helper function to format contexts
        function formatContexts(contexts: any[]): string {
            if (contexts.length === 0) {
                return '📋 No contexts found.';
            }
            
            return contexts.map((ctx, index) => {
                return `## Context ${index + 1}
**Type**: ${ctx.type || 'unknown'}
**Importance**: ${ctx.importance || 5}/10
**Content**: ${ctx.content || 'No content'}
**Created**: ${ctx.timestamp || 'Unknown'}
**Project**: ${path.basename(ctx.projectPath || 'Unknown')}
---`;
            }).join('\n');
        }

    // Register get_context tool
    server.registerTool(
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
            const contexts = database.getContexts(limit);
            const filtered = type ? contexts.filter(c => c.type === type) : contexts;
            
            return {
                content: [{
                    type: 'text',
                    text: formatContexts(filtered)
                }]
            };
        }
    );

    // Register add_context tool
    server.registerTool(
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
            const newContext = database.addContext({
                content,
                type,
                importance,
                tags: ['claude-desktop', 'manual-entry']
            });

            return {
                content: [{
                    type: 'text',
                    text: '✅ Context added successfully to project database'
                }]
            };
        }
    );

    // Register search_contexts tool
    server.registerTool(
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
            const results = database.searchContexts(query, limit);
            
            return {
                content: [{
                    type: 'text',
                    text: results.length > 0 
                        ? formatContexts(results)
                        : 'No contexts found matching your query.'
                }]
            };
        }
    );

    // Register get_project_info tool
    server.registerTool(
        'get_project_info',
        {
            title: 'Get Project Information',
            description: 'Get information about the current project',
            inputSchema: {}
        },
        async () => {
            const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
            const projectName = path.basename(workspacePath);
            const contextCount = database.getContexts(1000).length;

            return {
                content: [{
                    type: 'text',
                    text: `📁 **Project**: ${projectName}\n📍 **Path**: ${workspacePath}\n📊 **Contexts**: ${contextCount} entries\n🤖 **Server**: Claude Context Manager (Minimal)`
                }]
            };
        }
    );
    
    console.error('✅ Tools registered: get_context, add_context, search_contexts, get_project_info');
    
    async function start() {
        await server.connect(transport);
        console.error('🚀 Claude Context Manager MCP Server ready');
        console.error(`📁 Working directory: ${process.env.WORKSPACE_PATH || process.cwd()}`);
        
        // Keep alive with interval
        setInterval(() => {
            // Heartbeat
        }, 10000);
        
        // Handle signals
        process.on('SIGINT', () => {
            console.error('📴 MCP Server shutting down...');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.error('📴 MCP Server terminated');
            process.exit(0);
        });
    }
    
    start().catch(error => {
        console.error('❌ Start error:', error);
        process.exit(1);
    });
    
    // Handle unhandled errors
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    
    } catch (error) {
        console.error('💥 Failed to start MCP server:', error);
        process.exit(1);
    }
}

// Execute main function
main().catch((error) => {
    console.error('💥 Main function failed:', error);
    process.exit(1);
});