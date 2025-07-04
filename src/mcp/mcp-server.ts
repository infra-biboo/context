#!/usr/bin/env node

import { MCPServer } from './server';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';
import { ConfigStore } from '../core/config-store';

// Standalone MCP server entry point
async function main() {
    try {
        // Create minimal extension context for standalone operation
        const mockExtensionContext = {
            globalStorageUri: { fsPath: process.env.WORKSPACE_PATH || process.cwd() },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        } as any;

        // Initialize core components
        const database = new ContextDatabase(mockExtensionContext);
        await database.initialize();

        const configStore = ConfigStore.getInstance(mockExtensionContext);
        const agentManager = new AgentManager(configStore);

        // Start MCP server
        const server = new MCPServer(database, agentManager);
        await server.start();

        // Keep the process alive
        process.on('SIGINT', async () => {
            console.log('Shutting down MCP server...');
            await server.stop();
            process.exit(0);
        });

        console.log('MCP Server is running and ready for connections');
    } catch (error) {
        console.error('Failed to start standalone MCP server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}