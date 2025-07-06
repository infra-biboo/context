#!/usr/bin/env node

import { MCPServer } from './server';
import { ContextDatabase } from '../core/database';
import { DatabaseConfig } from '../core/database/types';
import { AgentManager } from '../agents/agent-manager';
import { ContextAnalysisService } from '../core/context-analysis-service';
import { ResponseFormattingService } from './response-formatting-service';
import { ConfigStore } from '../core/config-store';
import * as path from 'path';
import * as process from 'node:process';

/**
 * Standalone MCP Server
 * 
 * This server can be run independently of VS Code and supports:
 * - JSON (default) for local development with context limits
 * - PostgreSQL for production/team environments with vector search
 * - Hybrid mode for best of both worlds
 * 
 * Configuration via environment variables:
 * - DB_TYPE: json | postgresql | hybrid
 * - JSON_PATH: Path to JSON database file
 * - MAX_CONTEXTS: Maximum contexts to store in JSON (default: 1000)
 * - PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD: PostgreSQL connection
 * - VECTOR_DIMENSIONS: Vector dimensions for embeddings (default: 1536)
 */

class MCPServerStandalone {
    private database!: ContextDatabase;
    private agentManager!: AgentManager;
    private mcpServer!: MCPServer;

    constructor() {
        console.log('MCP Server Standalone starting...');
    }

    async initialize(): Promise<void> {
        try {
            // Create database configuration from environment
            const dbConfig = this.getDbConfigFromEnv();
            console.log(`Using database type: ${dbConfig.type}`);

            // Initialize database with adapter architecture
            // We create a mock extension context for standalone mode
            const mockContext = this.createMockExtensionContext();
            this.database = new ContextDatabase(mockContext, dbConfig);
            await this.database.initialize();
            console.log('Database initialized');

            // Initialize config store
            const configStore = ConfigStore.getInstance(mockContext);
            
            // Initialize agent manager
            this.agentManager = new AgentManager(this.database, configStore);
            await this.agentManager.initialize();
            console.log('Agent manager initialized');

            // Populate standard agents if needed
            try {
                await this.database.populateStandardAgents();
                console.log('Standard agents populated');
            } catch (error) {
                // Agents might already exist
                console.log('Standard agents already exist');
            }

            // Initialize MCP server
            const analysisService = new ContextAnalysisService();
            const formattingService = new ResponseFormattingService();
            
            this.mcpServer = new MCPServer(
                this.database,
                this.agentManager,
                analysisService,
                formattingService
            );

            // Start the server
            await this.mcpServer.start();
            console.log('MCP Server started successfully');
            console.log('Server is ready to receive requests via STDIO');

        } catch (error) {
            console.error('Failed to initialize MCP Server:', error);
            process.exit(1);
        }
    }

    private getDbConfigFromEnv(): DatabaseConfig {
        const dbType = (process.env.DB_TYPE || 'json') as DatabaseConfig['type'];

        switch (dbType) {
            case 'json':
                return {
                    type: 'json',
                    json: {
                        path: process.env.JSON_PATH || path.join(process.cwd(), 'mcp-context.json'),
                        maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
                    }
                };

            case 'postgresql':
                return {
                    type: 'postgresql',
                    postgresql: {
                        host: process.env.PG_HOST || 'localhost',
                        port: parseInt(process.env.PG_PORT || '5432'),
                        database: process.env.PG_DATABASE || 'context_manager',
                        username: process.env.PG_USERNAME || 'postgres',
                        password: process.env.PG_PASSWORD || '',
                        ssl: process.env.PG_SSL === 'true'
                    }
                };

            case 'hybrid':
                return {
                    type: 'hybrid',
                    hybrid: {
                        json: {
                            path: process.env.JSON_PATH || path.join(process.cwd(), 'mcp-context.json'),
                            maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
                        },
                        postgresql: {
                            host: process.env.PG_HOST || 'localhost',
                            port: parseInt(process.env.PG_PORT || '5432'),
                            database: process.env.PG_DATABASE || 'context_manager',
                            username: process.env.PG_USERNAME || 'postgres',
                            password: process.env.PG_PASSWORD || '',
                            ssl: process.env.PG_SSL === 'true',
                            vectorDimensions: parseInt(process.env.VECTOR_DIMENSIONS || '1536')
                        },
                        syncInterval: parseInt(process.env.SYNC_INTERVAL || '5'),
                        maxLocalContexts: parseInt(process.env.MAX_LOCAL_CONTEXTS || '500')
                    }
                };

            default:
                console.warn(`Unknown database type '${dbType}', defaulting to JSON`);
                return {
                    type: 'json',
                    json: {
                        path: process.env.JSON_PATH || path.join(process.cwd(), 'mcp-context.json'),
                        maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
                    }
                };
        }
    }

    private createMockExtensionContext(): any {
        // Create a minimal mock of VS Code extension context for standalone mode
        const storagePath = path.join(process.cwd(), '.mcp-storage');
        
        return {
            globalStorageUri: {
                fsPath: storagePath
            },
            extensionPath: process.cwd(),
            subscriptions: []
        };
    }

    async shutdown(): Promise<void> {
        console.log('Shutting down MCP Server...');
        
        if (this.mcpServer) {
            await this.mcpServer.stop();
        }
        
        if (this.database) {
            await this.database.close();
        }
        
        console.log('MCP Server stopped');
    }
}

// Main execution
async function main() {
    const server = new MCPServerStandalone();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await server.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await server.shutdown();
        process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    // Start the server
    await server.initialize();
}

// Run the server
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
